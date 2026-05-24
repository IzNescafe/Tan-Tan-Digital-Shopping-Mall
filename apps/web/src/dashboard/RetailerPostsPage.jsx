import { useEffect, useRef, useState } from "react";

const defaultProductForm = {
  title: "",
  brand: "",
  category: "",
  type: "",
  priceMMK: "",
  originalPriceMMK: "",
  discount: "",
  proof: "",
  description: "",
  image: "",
};

const MAX_IMAGE_SIDE = 1600;
const JPEG_QUALITY = 0.82;
const PRODUCT_CROP_WIDTH = 1200;
const PRODUCT_CROP_HEIGHT = 960;
const MIN_CROP_ZOOM = 1;
const MAX_CROP_ZOOM = 3;

function canvasToDataUrl(canvas) {
  const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(canvas.width, canvas.height));
  const targetWidth = Math.max(1, Math.round(canvas.width * scale));
  const targetHeight = Math.max(1, Math.round(canvas.height * scale));
  const output = document.createElement("canvas");
  output.width = targetWidth;
  output.height = targetHeight;
  const context = output.getContext("2d");
  context?.drawImage(canvas, 0, 0, targetWidth, targetHeight);
  return output.toDataURL("image/jpeg", JPEG_QUALITY);
}

function fileToCompressedDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        const context = canvas.getContext("2d");
        context?.drawImage(image, 0, 0);
        resolve(canvasToDataUrl(canvas));
      };
      image.onerror = () => reject(new Error("Image could not be processed."));
      image.src = String(reader.result || "");
    };
    reader.onerror = () => reject(new Error("Image could not be read."));
    reader.readAsDataURL(file);
  });
}

function loadImageElement(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Image could not be processed."));
    image.src = source;
  });
}

async function createCroppedProductImage(source, cropState) {
  const image = await loadImageElement(source);
  const canvas = document.createElement("canvas");
  canvas.width = PRODUCT_CROP_WIDTH;
  canvas.height = PRODUCT_CROP_HEIGHT;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Crop canvas is not available.");
  }

  const baseScale = Math.max(PRODUCT_CROP_WIDTH / image.width, PRODUCT_CROP_HEIGHT / image.height);
  const scale = baseScale * cropState.zoom;
  const drawWidth = image.width * scale;
  const drawHeight = image.height * scale;
  const maxShiftX = Math.max(0, (drawWidth - PRODUCT_CROP_WIDTH) / 2);
  const maxShiftY = Math.max(0, (drawHeight - PRODUCT_CROP_HEIGHT) / 2);
  const drawX = (PRODUCT_CROP_WIDTH - drawWidth) / 2 - (cropState.offsetX / 100) * maxShiftX;
  const drawY = (PRODUCT_CROP_HEIGHT - drawHeight) / 2 - (cropState.offsetY / 100) * maxShiftY;

  context.drawImage(image, drawX, drawY, drawWidth, drawHeight);
  return canvasToDataUrl(canvas);
}

function RetailerPostsPage({
  retailerDashboard,
  onSubmitRetailerProduct,
  editingProduct,
  onCancelEditRetailerProduct,
  onEditRetailerProduct,
  onDeleteRetailerProduct,
  onBack,
  statusMessage,
  isSubmitting,
}) {
  const [productForm, setProductForm] = useState(defaultProductForm);
  const [rawImage, setRawImage] = useState("");
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [submitNote, setSubmitNote] = useState(null);
  const [isApplyingCrop, setIsApplyingCrop] = useState(false);
  const [cropState, setCropState] = useState({
    zoom: 1,
    offsetX: 0,
    offsetY: 0,
  });
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const recentProducts = retailerDashboard?.inStockProducts || [];
  const isEditing = Boolean(editingProduct?.id);
  const livePreviewSource = rawImage || productForm.image;
  const livePreviewStyle = rawImage
    ? {
        objectPosition: `${50 + cropState.offsetX * 0.35}% ${50 + cropState.offsetY * 0.35}%`,
        transform: `scale(${cropState.zoom})`,
      }
    : undefined;
  const handleClosePage = () => {
    if (typeof onBack === "function") {
      onBack();
      return;
    }

    window.history.back();
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraOpen(false);
  };

  useEffect(() => () => stopCamera(), []);

  useEffect(() => {
    if (!editingProduct) {
      setProductForm(defaultProductForm);
      setRawImage("");
      resetCrop();
      return;
    }

    setProductForm({
      title: editingProduct.title || "",
      brand: editingProduct.brand || "",
      category: editingProduct.category || "",
      type: editingProduct.type || "",
      priceMMK: editingProduct.priceMMK || "",
      originalPriceMMK: editingProduct.originalPriceMMK || "",
      discount: editingProduct.discount || "",
      proof: editingProduct.proof || "",
      description: editingProduct.description || "",
      image: editingProduct.image || "",
    });
    setRawImage("");
    resetCrop();
  }, [editingProduct]);

  const resetCrop = () => {
    setCropState({
      zoom: 1,
      offsetX: 0,
      offsetY: 0,
    });
  };

  const updateField = (event) => {
    const { name, value } = event.target;
    setProductForm((current) => ({ ...current, [name]: value }));
  };

  const startCamera = async () => {
    try {
      setCameraError("");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      setCameraOpen(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (error) {
      setCameraError("Camera could not be opened. You can still upload an existing photo.");
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) {
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const context = canvas.getContext("2d");
    context?.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const image = canvasToDataUrl(canvas);
    setRawImage(image);
    setProductForm((current) => ({ ...current, image }));
    resetCrop();
    stopCamera();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const image = await fileToCompressedDataUrl(file);
      setRawImage(image);
      setProductForm((current) => ({ ...current, image }));
      resetCrop();
      setSubmitNote({
        type: "success",
        text: "Photo is ready. Adjust the crop if you want a cleaner product frame.",
      });
    } catch (error) {
      setSubmitNote({
        type: "error",
        text: error instanceof Error ? error.message : "Photo could not be prepared.",
      });
    } finally {
      event.target.value = "";
    }
  };

  const applyCrop = async () => {
    if (!rawImage) {
      return;
    }

    try {
      setIsApplyingCrop(true);
      const croppedImage = await createCroppedProductImage(rawImage, cropState);
      setProductForm((current) => ({ ...current, image: croppedImage }));
      setSubmitNote({
        type: "success",
        text: "Crop applied to this product image.",
      });
    } catch (error) {
      setSubmitNote({
        type: "error",
        text: error instanceof Error ? error.message : "Crop could not be applied.",
      });
    } finally {
      setIsApplyingCrop(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!productForm.image) {
      setSubmitNote({
        type: "error",
        text: "Please take a photo or upload one before publishing the product.",
      });
      return;
    }

    const isSaved = await onSubmitRetailerProduct(productForm);

    if (isSaved) {
      setProductForm(defaultProductForm);
      setRawImage("");
      resetCrop();
      stopCamera();
      setSubmitNote({
        type: "success",
        text: "Product published successfully.",
      });
    } else {
      setSubmitNote({
        type: "error",
        text: "Product could not be published yet. Please check the form and try again.",
      });
    }
  };

  return (
    <main className="main-layout">
      <section className="dashboard-section">
        <button className="subpage-close-button" type="button" onClick={handleClosePage} aria-label="Close post page">
          <span aria-hidden="true">{"\u2715"}</span>
        </button>

        <div className="customer-shell retailer-shell">
          <section className="customer-section customer-section-wide">
            <div className="customer-section-heading">
              <div>
                <p className="preview-label">Create post</p>
                <h3>{isEditing ? "Update your active post" : "Upload a clean new product post"}</h3>
              </div>
              <span className="deal-brand">Post Studio</span>
            </div>

            <div className="post-studio-banner">
              <div className="post-studio-pill">1 photo</div>
              <div className="post-studio-pill">MMK pricing</div>
              <div className="post-studio-pill">Instant preview</div>
            </div>

            {submitNote ? <div className={`status-banner is-${submitNote.type}`}>{submitNote.text}</div> : null}
            {statusMessage?.type === "error" ? (
              <div className={`status-banner is-${statusMessage.type}`}>{statusMessage.text}</div>
            ) : null}

            <form className="retailer-post-layout" onSubmit={handleSubmit}>
              <div className="retailer-post-card">
                <div className="retailer-post-card-head">
                  <div>
                    <p className="preview-label">Product details</p>
                    <h4>Basic information</h4>
                  </div>
                </div>

                <div className="retailer-upload-form">
                  <label className="upload-field">
                    Product title
                    <input
                      className="search-input"
                      name="title"
                      value={productForm.title}
                      onChange={updateField}
                      placeholder="Adidas Samba"
                      required
                    />
                  </label>

                  <label className="upload-field">
                    Brand
                    <input
                      className="search-input"
                      name="brand"
                      value={productForm.brand}
                      onChange={updateField}
                      placeholder="Adidas"
                      required
                    />
                  </label>

                  <label className="upload-field">
                    Category
                    <input
                      className="search-input"
                      name="category"
                      value={productForm.category}
                      onChange={updateField}
                      placeholder="Sneakers"
                      required
                    />
                  </label>

                  <label className="upload-field">
                    Type
                    <input
                      className="search-input"
                      name="type"
                      value={productForm.type}
                      onChange={updateField}
                      placeholder="Men's shoes"
                      required
                    />
                  </label>

                  <label className="upload-field">
                    Price
                    <input
                      className="search-input"
                      name="priceMMK"
                      value={productForm.priceMMK}
                      onChange={updateField}
                      placeholder="185,000 MMK"
                      required
                    />
                  </label>

                  <label className="upload-field">
                    Original price
                    <input
                      className="search-input"
                      name="originalPriceMMK"
                      value={productForm.originalPriceMMK}
                      onChange={updateField}
                      placeholder="225,000 MMK"
                      required
                    />
                  </label>

                  <label className="upload-field">
                    Discount label
                    <input
                      className="search-input"
                      name="discount"
                      value={productForm.discount}
                      onChange={updateField}
                      placeholder="-18%"
                      required
                    />
                  </label>

                  <label className="upload-field">
                    Proof note
                    <input
                      className="search-input"
                      name="proof"
                      value={productForm.proof}
                      onChange={updateField}
                      placeholder="Receipt and store pickup photo"
                      required
                    />
                  </label>

                  <label className="upload-field retailer-upload-textarea">
                    Description
                    <textarea
                      className="search-input"
                      name="description"
                      rows="4"
                      value={productForm.description}
                      onChange={updateField}
                      placeholder="Short product details for customers."
                      required
                    />
                  </label>
                </div>
              </div>

              <div className="retailer-post-side">
                <div className="retailer-post-card">
                  <div className="retailer-post-card-head">
                    <div>
                      <p className="preview-label">Product photo</p>
                      <h4>Camera and upload</h4>
                    </div>
                  </div>

                  <div className="camera-tools">
                    <button className="secondary-button" type="button" onClick={startCamera}>
                      Take photo
                    </button>
                    <label className="secondary-button">
                      Upload photo
                      <input type="file" accept="image/*" capture="environment" hidden onChange={handleFileChange} />
                    </label>
                    {productForm.image ? <p className="camera-note">Photo ready for this post.</p> : null}
                    {cameraError ? <p className="camera-note">{cameraError}</p> : null}
                  </div>

                  {cameraOpen ? (
                    <div className="camera-panel">
                      <video ref={videoRef} className="camera-preview" autoPlay muted playsInline />
                      <div className="deal-actions">
                        <button className="primary-button" type="button" onClick={capturePhoto}>
                          Capture photo
                        </button>
                        <button className="secondary-button" type="button" onClick={stopCamera}>
                          Close camera
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {productForm.image ? (
                    <div className="camera-panel">
                      <img className="camera-preview" src={productForm.image} alt="Product preview" />
                    </div>
                  ) : (
                    <div className="post-image-placeholder">
                      <strong>Photo preview</strong>
                      <p>Take a photo or upload one to see the product card preview here.</p>
                    </div>
                  )}

                  {rawImage ? (
                    <div className="image-cropper-panel">
                      <div className="retailer-post-card-head">
                        <div>
                          <p className="preview-label">Manual crop</p>
                          <h4>Choose the frame yourself</h4>
                        </div>
                      </div>

                      <div className="image-cropper-stage">
                        <div className="image-cropper-frame">
                          <img
                            className="image-cropper-image"
                            src={rawImage}
                            alt="Crop source"
                            style={{
                              objectPosition: `${50 + cropState.offsetX * 0.35}% ${50 + cropState.offsetY * 0.35}%`,
                              transform: `scale(${cropState.zoom})`,
                            }}
                          />
                        </div>
                      </div>

                      <div className="image-cropper-controls">
                        <label className="crop-slider-field">
                          Zoom
                          <input
                            type="range"
                            min={MIN_CROP_ZOOM}
                            max={MAX_CROP_ZOOM}
                            step="0.01"
                            value={cropState.zoom}
                            onChange={(event) =>
                              setCropState((current) => ({
                                ...current,
                                zoom: Number(event.target.value),
                              }))
                            }
                          />
                        </label>

                        <label className="crop-slider-field">
                          Left / right
                          <input
                            type="range"
                            min="-100"
                            max="100"
                            step="1"
                            value={cropState.offsetX}
                            onChange={(event) =>
                              setCropState((current) => ({
                                ...current,
                                offsetX: Number(event.target.value),
                              }))
                            }
                          />
                        </label>

                        <label className="crop-slider-field">
                          Up / down
                          <input
                            type="range"
                            min="-100"
                            max="100"
                            step="1"
                            value={cropState.offsetY}
                            onChange={(event) =>
                              setCropState((current) => ({
                                ...current,
                                offsetY: Number(event.target.value),
                              }))
                            }
                          />
                        </label>
                      </div>

                      <div className="deal-actions">
                        <button className="primary-button" type="button" onClick={applyCrop} disabled={isApplyingCrop}>
                          {isApplyingCrop ? "Applying..." : "Use crop"}
                        </button>
                        <button className="secondary-button" type="button" onClick={resetCrop}>
                          Reset crop
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="retailer-post-card">
                  <div className="retailer-post-card-head">
                    <div>
                      <p className="preview-label">Live preview</p>
                      <h4>How customers will see it</h4>
                    </div>
                  </div>

                  <article className="deal-card post-preview-card">
                    <div className="deal-image-wrap deal-image-wrap-product">
                      {livePreviewSource ? (
                        <img
                          className="deal-image image-cropper-image"
                          src={livePreviewSource}
                          alt={productForm.title || "Product preview"}
                          style={livePreviewStyle}
                        />
                      ) : (
                        <div className="post-preview-empty">Add a product photo</div>
                      )}
                      <span className="discount-badge">{productForm.discount || "-0%"}</span>
                    </div>
                    <div className="deal-card-body">
                      <div className="deal-hero">
                        <span className="deal-brand">{productForm.brand || "Brand"}</span>
                        <span className="deal-type">{productForm.type || "Type"}</span>
                      </div>
                      <h3>{productForm.title || "Product title"}</h3>
                      <p className="deal-meta">{productForm.category || "Category"}</p>
                      <div className="price-row">
                        <strong>{productForm.priceMMK || "0 MMK"}</strong>
                        <span>{productForm.originalPriceMMK || "Original price"}</span>
                      </div>
                      <p className="camera-note">{productForm.description || "Product description preview will show here."}</p>
                    </div>
                  </article>

                  <button className="primary-button retailer-post-submit" type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (isEditing ? "Saving..." : "Uploading...") : isEditing ? "Save changes" : "Publish product"}
                  </button>
                  {isEditing ? (
                    <button
                      className="secondary-button retailer-post-submit"
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => onCancelEditRetailerProduct?.()}
                    >
                      Cancel edit
                    </button>
                  ) : null}
                </div>
              </div>
            </form>
          </section>

          <section className="customer-section customer-section-wide">
            <p className="preview-label">Recent active posts</p>
            <h3>Still in stock</h3>
            <div className="deal-grid retailer-product-grid">
              {recentProducts.length > 0 ? (
                recentProducts.map((product) => (
                  <article key={product.id} className="deal-card">
                    <div className="deal-image-wrap deal-image-wrap-product">
                      <img className="deal-image" src={product.image} alt={product.title} />
                      <span className="discount-badge">{product.discount}</span>
                    </div>
                    <div className="deal-card-body">
                      <div className="deal-hero">
                        <span className="deal-brand">{product.brand}</span>
                        <span className="deal-type">{product.type}</span>
                      </div>
                      <h3>{product.title}</h3>
                      <div className="price-row">
                        <strong>{product.priceMMK}</strong>
                        <span>{product.originalPriceMMK}</span>
                      </div>
                      <div className="deal-actions">
                        <button
                          className="secondary-button"
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => onEditRetailerProduct?.(product)}
                        >
                          Edit post
                        </button>
                        <button
                          className="secondary-button danger-button"
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => onDeleteRetailerProduct?.(product.id)}
                        >
                          Delete post
                        </button>
                      </div>
                    </div>
                  </article>
                ))
              ) : (
                <div className="empty-state">No active posts yet. Upload your first item here.</div>
              )}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

export default RetailerPostsPage;




