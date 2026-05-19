function LoginForm({ loginForm, needsRetailerCode, isSubmitting, updateForm, onSubmit }) {
  return (
    <form className="auth-card" onSubmit={onSubmit}>
      <p className="preview-label">Login</p>
      <h3>Sign in with your saved account</h3>
      <p className="panel-text">Your role is loaded from the database after login. Admin is not shown in signup tabs.</p>

      <label className="field">
        <span>Email</span>
        <input name="email" type="email" placeholder="you@example.com" value={loginForm.email} onChange={updateForm} />
      </label>

      <label className="field">
        <span>Password</span>
        <input
          name="password"
          type="password"
          placeholder="Enter password"
          value={loginForm.password}
          onChange={updateForm}
        />
      </label>

      {needsRetailerCode ? (
        <label className="field">
          <span>Verification code</span>
          <input
            name="code"
            type="text"
            placeholder="Enter 6-digit code"
            value={loginForm.code}
            onChange={updateForm}
          />
        </label>
      ) : null}

      <button className="primary-button submit-button" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Please wait..." : "Login"}
      </button>
    </form>
  );
}

function CustomerSignupForm({ customerForm, isSubmitting, updateForm, onSubmit }) {
  return (
    <form className="auth-card" onSubmit={onSubmit}>
      <p className="preview-label">Customer signup</p>
      <h3>Create a free customer account</h3>
      <p className="panel-text">Customers can sign up and log in immediately without payment.</p>

      <label className="field">
        <span>Name</span>
        <input
          name="name"
          type="text"
          placeholder="Your full name"
          value={customerForm.name}
          onChange={updateForm}
        />
      </label>

      <label className="field">
        <span>Email</span>
        <input
          name="email"
          type="email"
          placeholder="customer@example.com"
          value={customerForm.email}
          onChange={updateForm}
        />
      </label>

      <label className="field">
        <span>Password</span>
        <input
          name="password"
          type="password"
          placeholder="Create password"
          value={customerForm.password}
          onChange={updateForm}
        />
      </label>

      <button className="primary-button submit-button" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Creating..." : "Create customer account"}
      </button>
    </form>
  );
}

function RetailerSignupForm({ retailerForm, isSubmitting, updateForm, onSubmit }) {
  return (
    <form className="auth-card" onSubmit={onSubmit}>
      <p className="preview-label">Retailer application</p>
      <h3>Apply with payment reference</h3>
      <p className="panel-text">
        Submit your application with a payment reference. After admin approval, a verification code will be emailed to
        your retailer account.
      </p>

      <label className="field">
        <span>Name</span>
        <input
          name="name"
          type="text"
          placeholder="Retailer owner name"
          value={retailerForm.name}
          onChange={updateForm}
        />
      </label>

      <label className="field">
        <span>Shop name</span>
        <input
          name="shopName"
          type="text"
          placeholder="Bangkok outlet shopper"
          value={retailerForm.shopName}
          onChange={updateForm}
        />
      </label>

      <label className="field">
        <span>Email</span>
        <input
          name="email"
          type="email"
          placeholder="retailer@example.com"
          value={retailerForm.email}
          onChange={updateForm}
        />
      </label>

      <label className="field">
        <span>Password</span>
        <input
          name="password"
          type="password"
          placeholder="Create password"
          value={retailerForm.password}
          onChange={updateForm}
        />
      </label>

      <label className="field">
        <span>Payment reference</span>
        <input
          name="paymentReference"
          type="text"
          placeholder="TEST-PAY-001"
          value={retailerForm.paymentReference}
          onChange={updateForm}
        />
      </label>

      <button className="primary-button submit-button" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Processing..." : "Submit retailer application"}
      </button>
    </form>
  );
}

function AuthFormPanel({
  authTabs,
  tab,
  setTab,
  loginForm,
  customerForm,
  retailerForm,
  needsRetailerCode,
  isSubmitting,
  updateLoginForm,
  updateCustomerForm,
  updateRetailerForm,
  onLogin,
  onCustomerSignup,
  onRetailerSignup,
}) {
  return (
    <aside className="login-panel" id="login-panel">
      <div className="tab-row" role="tablist" aria-label="Auth tabs">
        {authTabs.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`tab-button ${tab === item.id ? "is-active" : ""}`}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "login" ? (
        <LoginForm
          loginForm={loginForm}
          needsRetailerCode={needsRetailerCode}
          isSubmitting={isSubmitting}
          updateForm={updateLoginForm}
          onSubmit={onLogin}
        />
      ) : null}

      {tab === "customer" ? (
        <CustomerSignupForm
          customerForm={customerForm}
          isSubmitting={isSubmitting}
          updateForm={updateCustomerForm}
          onSubmit={onCustomerSignup}
        />
      ) : null}

      {tab === "retailer" ? (
        <RetailerSignupForm
          retailerForm={retailerForm}
          isSubmitting={isSubmitting}
          updateForm={updateRetailerForm}
          onSubmit={onRetailerSignup}
        />
      ) : null}
    </aside>
  );
}

export default AuthFormPanel;
