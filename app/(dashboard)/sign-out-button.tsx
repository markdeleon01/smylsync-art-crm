'use client';

export function SignOutButton() {
  const handleSignOut = async () => {
    // Imperatively insert overlay into the DOM so it survives
    // the dropdown unmounting the React component tree
    const spinStyle = document.createElement('style');
    spinStyle.textContent =
      '@keyframes sign-out-spin { to { transform: rotate(360deg); } }';
    document.head.appendChild(spinStyle);

    const overlay = document.createElement('div');
    Object.assign(overlay.style, {
      position: 'fixed',
      inset: '0',
      zIndex: '9999',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0,0,0,0.3)',
      backdropFilter: 'blur(4px)',
      pointerEvents: 'auto'
    });
    overlay.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;gap:16px;">
        <div style="position:relative;width:64px;height:64px;">
          <div style="position:absolute;inset:0;border-radius:50%;border:4px solid #e5e7eb;"></div>
          <div style="position:absolute;inset:0;border-radius:50%;border:4px solid transparent;border-top-color:#FFA500;animation:sign-out-spin 1s linear infinite;"></div>
        </div>
        <p style="font-size:1.125rem;font-weight:600;color:#1f2937;">Signing out...</p>
      </div>
    `;
    document.body.appendChild(overlay);

    await Promise.all([
      fetch('/api/auth/logout', { method: 'POST' }),
      new Promise((resolve) => setTimeout(resolve, 1000))
    ]);

    window.location.href = '/login';
  };

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className="w-full cursor-default bg-transparent p-0 text-left text-sm outline-none"
    >
      Sign Out
    </button>
  );
}
