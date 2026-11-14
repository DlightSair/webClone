import Link from "next/link";

export const metadata = { title: "Sign in" };

// The original signs in through the backend (mobile OTP / social providers). This static copy keeps the screen.
export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-1 flex-col bg-white px-6 pb-24 pt-16">
      <h1 className="text-[28px] font-bold text-[#1C1B1F]">PARQIS</h1>
      <p className="mt-1 text-[14px] text-[#74707A]">Sign in to continue</p>
      <form className="mt-10 space-y-4">
        <label className="block">
          <span className="text-[13px] font-medium text-[#1C1B1F]">Mobile number</span>
          <div className="mt-1.5 flex h-12 items-center rounded-[6px] border border-[#C8C5D0] px-3 focus-within:border-[#A0146C]">
            <span className="pr-2 text-[14px] text-[#47464F]">+91</span>
            <input type="tel" inputMode="numeric" maxLength={10} placeholder="Enter mobile number" className="h-full w-full bg-transparent text-[14px] outline-none" />
          </div>
        </label>
        <button type="button" className="h-12 w-full rounded-[6px] bg-[#A92645] text-[16px] font-semibold text-white transition hover:bg-[#86105B]">
          Get OTP
        </button>
      </form>
      <p className="mt-6 text-center text-[11px] text-[#74707A]">
        By continuing you agree to our{" "}
        <Link href="/consumertermsofuse" className="text-[#A92645] underline">
          Terms of Use
        </Link>{" "}
        and{" "}
        <Link href="/consumerprivacypolicy" className="text-[#A92645] underline">
          Privacy Policy
        </Link>
      </p>
      <p className="mt-10 text-center text-[12px] text-[#74707A]">Sign-in is not available in this static demo.</p>
      <Link href="/" className="mt-3 text-center text-[13px] font-medium text-[#A92645]">
        Continue shopping
      </Link>
    </main>
  );
}
