import Link from "next/link";
import { auth0 } from "@/src/lib/auth0";
import Profile from "@/src/components/Profile";

export default async function TopBar() {
  const session = await auth0.getSession();
  const user = session?.user;

  return (
    <header className="top-bar">
      <Link href="/" className="brand">
        <div className="brand-mark">NL</div>
        <div>
          <p className="brand-title">Newsletter Console</p>
          <p className="brand-subtitle">Draft, review, send</p>
        </div>
      </Link>
      <nav className="nav-links">
        <Link href="/" className="nav-link">
          Dashboard
        </Link>
        <Link href="/mailing-lists" className="nav-link">
          Lists
        </Link>
        <Link href="/campaigns" className="nav-link">
          Campaigns
        </Link>
      </nav>
      <div className="auth-area">
        {user ? (
          <>
            <div className="profile-mini">
              <Profile />
            </div>
            <Link href="/logout" className="nav-link">
              Log out
            </Link>
          </>
        ) : (
          <Link href="/login" className="nav-link">
            Log in
          </Link>
        )}
      </div>
    </header>
  );
}
