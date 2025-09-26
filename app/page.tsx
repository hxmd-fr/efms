import Image from "next/image";
import Link from "next/link"; // Import Link for navigation

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-900 font-sans p-4">
      <section className="relative w-full max-w-4xl bg-white shadow-xl rounded-2xl overflow-hidden md:flex md:flex-row md:items-center md:justify-between p-8 md:p-12 border border-gray-100 transform transition-all duration-500 ease-in-out hover:shadow-2xl hover:scale-[1.005]">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-purple-50 opacity-70"></div>
        <div className="absolute inset-0 bg-[url('/grid.png')] bg-repeat opacity-10"></div>

        <div className="relative z-10 text-center md:text-left md:w-1/2">
          <div className="mb-6 md:mb-8 flex justify-center md:justify-start">
            <Image
              src="/logo.png"
              alt="EFMS Logo"
              width={120}
              height={120}
              className="drop-shadow-lg"
            />
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-800 leading-tight mb-4">
            Enterprise Finance <br className="hidden md:inline"/> Management System
          </h1>
          <p className="text-md md:text-lg text-gray-600 mb-8 leading-relaxed">
            Revolutionize your financial operations with <strong className="text-indigo-600">AI-powered insights</strong>. Predict expenses, detect fraud, and optimize budgets with unparalleled ease and precision.
          </p>
          
          {/* This Link now correctly points to your /login page */}
          <Link href="/login" passHref>
            <span className="inline-flex items-center justify-center bg-indigo-600 text-white px-8 py-3 rounded-full text-lg font-semibold shadow-lg hover:bg-indigo-700 transform transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-indigo-300 focus:ring-opacity-75 cursor-pointer">
              Get Started
              <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
            </span>
          </Link>
        </div>

        <div className="hidden md:flex md:w-1/2 justify-center items-center mt-8 md:mt-0">
           <Image
              src="/finance_illustration.png"
              alt="Financial Management Illustration"
              width={350}
              height={350}
              className="opacity-80"
            />
        </div>
      </section>
    </main>
  );
}
