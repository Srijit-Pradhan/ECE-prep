import { useEffect } from "react";
import Navbar from "../components/Navbar";
import UploadForm from "../components/UploadForm";

const UploadPage = () => {
  useEffect(() => {
    document.title = "ExamPrep";
  }, []);
  return (
    <div className="page-enter min-h-screen pb-10">
      <Navbar />

      <main className="mx-auto w-full max-w-3xl px-3 py-6 sm:px-4 md:px-6 md:py-8">
        <section className="mb-6 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">Upload Notes and Papers</h1>
          <p className="mt-2 text-sm text-slate-600 sm:text-base">Share helpful resources with ECE students. Admin will review every upload.</p>
        </section>

        <UploadForm />
      </main>
    </div>
  );
};

export default UploadPage;
