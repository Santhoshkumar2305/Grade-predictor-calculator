"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import { getAuthToken } from "../../lib/auth";
import "../../styles/globals.css";

function DashboardPage() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    setIsClient(true);
    const token = getAuthToken();
    if (!token) {
      router.replace("/login");
    }
  }, [router]);

  if (!isClient) {
    return (
      <div
        className="container"
        style={{ textAlign: "center", padding: "50px" }}
      >
        <h1>Loading Dashboard...</h1>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="container dashboardWrapper">
        <div className="contentSection">
          <h1 className="heading">Welcome to Grade Predictor!</h1>
          <p className="description">
            This application helps you predict your academic performance based
            on your current assessments and study patterns. You can also keep
            track of your past predictions and analyze how well you're doing
            over time.
          </p>
          <p className="features">
            🔍 Analyze grades <br />
            📊 Track academic performance <br />
            💾 View history & trends
          </p>
          <a href="/predict" className="predictButton">
            🎯 Predict Grade
          </a>
        </div>
        <div className="imageSection">
          <img
            src="/grade-predictor.png"
            alt="Grade Prediction"
            className="dashboardImage"
          />
        </div>
      </div>
    </>
  );
}
export default DashboardPage;