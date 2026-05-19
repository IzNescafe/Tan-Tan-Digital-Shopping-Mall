import { useEffect, useMemo, useState } from "react";

const profileSidebarItems = [
  { id: "account", label: "My account" },
  { id: "contact", label: "Contact details" },
  { id: "location", label: "Location" },
  { id: "notes", label: "Notes" },
];

function buildInitialProfile(session) {
  return {
    name: session?.name || "",
    email: session?.email || "",
    shopName: session?.shopName || "",
    phone: session?.phone || "",
    telegram: session?.telegram || "",
    city: session?.city || "",
    township: session?.township || "",
    address: session?.address || "",
    profileNote: session?.profileNote || "",
    profileImage: session?.profileImage || "",
    faceScanImage: session?.faceScanImage || "",
    identityStatus: session?.identityStatus || (session?.role === "retailer" ? "scan_required" : "not_required"),
  };
}

function getInitials(label) {
  return String(label || "TT")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

function ProfileField({ label, name, value, onChange, type = "text", readOnly = false, placeholder = "" }) {
  return (
    <label className="profile-account-row">
      <div className="profile-account-copy">
        <span className="profile-account-label">{label}</span>
      </div>
      <input
        className="inline-input profile-account-input"
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        readOnly={readOnly}
        placeholder={placeholder}
      />
    </label>
  );
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("File could not be read."));
    reader.readAsDataURL(file);
  });
}

function UserProfilePage({
  session,
  statusMessage,
  isSubmitting,
  onSaveProfile,
  onBack,
}) {
  const [form, setForm] = useState(() => buildInitialProfile(session));
  const [activeSection, setActiveSection] = useState("account");

  useEffect(() => {
    setForm(buildInitialProfile(session));
  }, [session]);

  useEffect(() => {
    const sectionIds = profileSidebarItems.map((item) => item.id);
    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter(Boolean);

    if (!sections.length) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0];

        if (visibleEntry?.target?.id) {
          setActiveSection(visibleEntry.target.id);
        }
      },
      {
        rootMargin: "-20% 0px -55% 0px",
        threshold: [0.2, 0.45, 0.7],
      },
    );

    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  const profileCompletion = useMemo(() => {
    const fields = [
      form.name,
      form.phone,
      form.telegram,
      form.city,
      form.township,
      form.address,
      form.profileNote,
      session?.role === "retailer" ? form.shopName : "filled",
    ];
    const completed = fields.filter((value) => String(value || "").trim()).length;
    return Math.round((completed / fields.length) * 100);
  }, [form, session?.role]);

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const updateImageField = (fieldName) => async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const image = await readFileAsDataUrl(file);
    setForm((current) => ({
      ...current,
      [fieldName]: image,
      ...(fieldName === "faceScanImage" ? { identityStatus: "pending_review" } : {}),
    }));
    event.target.value = "";
  };

  const resetForm = () => {
    setForm(buildInitialProfile(session));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await onSaveProfile(form);
  };

  const handleBack = () => {
    if (typeof onBack === "function") {
      onBack();
      return;
    }

    window.history.back();
  };

  const handleSectionJump = (sectionId) => {
    setActiveSection(sectionId);
    const section = document.getElementById(sectionId);
    section?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const displayTitle = session?.role === "retailer" ? form.shopName || form.name : form.name;
  const profileAvatar = form.profileImage || "";
  const profileStatusMessage =
    statusMessage && !(statusMessage.type === "success" && String(statusMessage.text || "").startsWith("Welcome back"))
      ? statusMessage
      : null;

  return (
    <main className="main-layout">
      <section className="dashboard-section profile-dashboard-section">
        <div className="profile-settings-shell">
          <aside className={`profile-settings-sidebar is-${session?.role || "customer"}`}>
            <div className="profile-sidebar-kicker">
              <p className="preview-label">Sections</p>
              <strong>{session?.role === "retailer" ? "Retailer profile" : session?.role === "admin" ? "Admin profile" : "Customer profile"}</strong>
            </div>

            <nav className="profile-sidebar-nav" aria-label="Profile settings navigation">
              {profileSidebarItems.map((item) => (
                <button
                  key={item.id}
                  className={`profile-sidebar-link${activeSection === item.id ? " is-active" : ""}`}
                  type="button"
                  onClick={() => handleSectionJump(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </aside>

          <form className={`profile-settings-main is-${session?.role || "customer"}`} onSubmit={handleSubmit}>
            <button className="profile-page-back" type="button" onClick={handleBack} aria-label="Close profile">
              <span aria-hidden="true">{"\u2715"}</span>
            </button>

            <div className="profile-settings-header">
              <div>
                <p className="preview-label">Settings</p>
                <h2>Edit profile</h2>
                <p className="dashboard-copy">Update the key details customers and retailers need.</p>
              </div>
            </div>

            {profileStatusMessage ? (
              <div className={`status-banner is-${profileStatusMessage.type}`}>{profileStatusMessage.text}</div>
            ) : null}

            <section className={`profile-hero-card is-${session?.role || "customer"}`}>
              <div className="profile-hero-banner" />
              <div className={`profile-hero-content is-${session?.role || "customer"}`}>
                <div className="profile-avatar-xl">
                  {profileAvatar ? <img className="profile-avatar-image" src={profileAvatar} alt={displayTitle || "Profile"} /> : getInitials(displayTitle)}
                </div>
                <div className="profile-hero-copy">
                  <h3>{displayTitle || "Your profile"}</h3>
                  <p>{session?.email}</p>
                  <div className="profile-meta-pills">
                    <span className="profile-meta-pill">{session?.role}</span>
                    <span className="profile-meta-pill">{session?.status}</span>
                    <span className="profile-meta-pill">{profileCompletion}% complete</span>
                  </div>
                </div>
              </div>
            </section>

            <section className="profile-account-card" id="account">
              <div className="profile-card-heading">
                <div>
                  <p className="preview-label">Account</p>
                  <h3>Basic information</h3>
                </div>
              </div>

              <div className="profile-account-list">
                <div className="profile-upload-row">
                  <div className="profile-upload-copy">
                    <span className="profile-account-label">Profile photo</span>
                    <p>Upload a clear profile image for chats and order contact cards.</p>
                  </div>
                  <div className="profile-upload-actions">
                    <label className="secondary-button profile-upload-button">
                      Upload photo
                      <input type="file" accept="image/*" hidden onChange={updateImageField("profileImage")} />
                    </label>
                  </div>
                </div>
                <ProfileField label="Full name" name="name" value={form.name} onChange={updateField} placeholder="Your full name" />
                {session?.role === "retailer" ? (
                  <ProfileField label="Shop name" name="shopName" value={form.shopName} onChange={updateField} placeholder="Your shop name" />
                ) : null}
                <ProfileField label="Email address" name="email" type="email" value={form.email} onChange={updateField} readOnly />
              </div>
            </section>

            {session?.role === "retailer" ? (
              <section className="profile-account-card" id="identity">
                <div className="profile-card-heading">
                  <div>
                    <p className="preview-label">Identity</p>
                    <h3>Face scan</h3>
                  </div>
                  <span className="profile-meta-pill">{form.identityStatus || "scan_required"}</span>
                </div>

                <div className="profile-upload-row">
                  <div className="profile-upload-copy">
                    <span className="profile-account-label">Retailer selfie scan</span>
                    <p>Upload a clear front-facing selfie. This is a scan upload flow, not full facial recognition yet.</p>
                  </div>
                  <div className="profile-upload-actions">
                    <label className="secondary-button profile-upload-button">
                      Scan face
                      <input type="file" accept="image/*" capture="user" hidden onChange={updateImageField("faceScanImage")} />
                    </label>
                  </div>
                </div>

                {form.faceScanImage ? (
                  <img className="profile-face-preview" src={form.faceScanImage} alt="Face scan preview" />
                ) : null}
              </section>
            ) : null}

            <section className="profile-account-card" id="contact">
              <div className="profile-card-heading">
                <div>
                  <p className="preview-label">Contact</p>
                  <h3>Contact</h3>
                </div>
              </div>

              <div className="profile-account-list">
                <ProfileField label="Phone number" name="phone" value={form.phone} onChange={updateField} placeholder="09..." />
                <ProfileField
                  label="Telegram or messenger"
                  name="telegram"
                  value={form.telegram}
                  onChange={updateField}
                  placeholder="@username or contact handle"
                />
              </div>
            </section>

            <section className="profile-account-card" id="location">
              <div className="profile-card-heading">
                <div>
                  <p className="preview-label">Location</p>
                  <h3>{session?.role === "customer" ? "Delivery" : "Location"}</h3>
                </div>
              </div>

              <div className="profile-account-list">
                <div className="profile-two-column-grid">
                  <ProfileField label="City" name="city" value={form.city} onChange={updateField} placeholder="Yangon" />
                  <ProfileField label="Township" name="township" value={form.township} onChange={updateField} placeholder="Hlaing" />
                </div>

                <label className="profile-text-block">
                  <span className="profile-account-label">{session?.role === "customer" ? "Delivery address" : "Address"}</span>
                  <textarea
                    className="dashboard-textarea profile-textarea"
                    name="address"
                    value={form.address}
                    onChange={updateField}
                    placeholder={
                      session?.role === "customer"
                        ? "Street, condo, landmark, delivery instructions"
                        : "Shop address or pickup point"
                    }
                  />
                </label>
              </div>
            </section>

            <section className="profile-account-card" id="notes">
              <div className="profile-card-heading">
                <div>
                  <p className="preview-label">Notes</p>
                  <h3>{session?.role === "retailer" ? "Shop notes" : "Profile note"}</h3>
                </div>
              </div>

              <label className="profile-text-block">
                <span className="profile-account-label">
                  {session?.role === "retailer" ? "Sourcing focus or shop details" : "Sizing, delivery, or contact notes"}
                </span>
                <textarea
                  className="dashboard-textarea profile-textarea"
                  name="profileNote"
                  value={form.profileNote}
                  onChange={updateField}
                  placeholder={
                    session?.role === "retailer"
                      ? "Brands you focus on, service hours, reply speed, sourcing preferences"
                      : "Preferred contact time, sizing habits, apartment gate instructions"
                  }
                />
              </label>
            </section>

            <div className="profile-action-bar">
              <button className="secondary-button" type="button" onClick={resetForm} disabled={isSubmitting}>
                Reset
              </button>
              <button className="primary-button" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save profile"}
              </button>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}

export default UserProfilePage;
