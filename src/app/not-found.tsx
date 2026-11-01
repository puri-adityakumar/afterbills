import Link from "next/link";

export default function NotFound() {
  return <main id="main" className="boot-state">
    <p>404 / A small detour</p>
    <h1>Nothing planned here.</h1>
    <p>Your local plan is still where you left it.</p>
    <Link className="button" href="/" prefetch={false}>Back to AfterBills</Link>
  </main>;
}
