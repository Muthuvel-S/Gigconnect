// src/components/MaintenancePage.js
import React from "react";

const MaintenancePage = ({
  title = "🚧 Site Under Maintenance",
  message = "Sorry for the inconvenience. We are currently performing updates. Please check back soon.",
  showContact = true, // optional contact/info line
}) => {
  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-100 to-gray-200 p-6"
      aria-live="polite"
    >
      <div className="max-w-2xl w-full bg-white rounded-xl shadow-xl p-8 text-center">
        <h1 className="text-3xl md:text-4xl font-extrabold mb-4">{title}</h1>

        <p className="text-lg text-gray-700 mb-6">{message}</p>

        {showContact && (
          <p className="text-sm text-gray-500">
            If this is urgent, contact support at <strong>support@yourcompany.com</strong>.
          </p>
        )}

        <div className="mt-8">
          <span className="inline-block px-4 py-2 rounded-md bg-gray-100 text-gray-600 text-xs">
            We'll be back shortly
          </span>
        </div>
      </div>
    </div>
  );
};

export default MaintenancePage;
