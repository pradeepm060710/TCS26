import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import {
  ShieldCheck,
  BrainCircuit,
  LockKeyhole,
  ScanLine,
} from "lucide-react";

import "./loading-screen.css";

const messages = [
  "Initializing secure environment...",
  "Verifying access credentials...",
  "Preparing claims workspace...",
  "Establishing secure connection...",
  "Workspace ready.",
];

function LoadingScreen() {
  const [progress, setProgress] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const progressTimer = setInterval(() => {
      setProgress((previous) => Math.min(previous + 1, 100));
    }, 28);

    const messageTimer = setInterval(() => {
      setMessageIndex((previous) =>
        Math.min(previous + 1, messages.length - 1)
      );
    }, 750);

    return () => {
      clearInterval(progressTimer);
      clearInterval(messageTimer);
    };
  }, []);

  return (
    <motion.main
      className="nexus-loader"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* BACKGROUND */}

      <div className="loader-grid" />
      <div className="loader-glow loader-glow-one" />
      <div className="loader-glow loader-glow-two" />

      <div className="loader-content">

        {/* ROTATING ORBITS */}

        <motion.div
          className="loader-orbit orbit-a"
          animate={{ rotate: 360 }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <span className="orbit-dot" />
        </motion.div>

        <motion.div
          className="loader-orbit orbit-b"
          animate={{ rotate: -360 }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <span className="orbit-dot orbit-dot-two" />
        </motion.div>

        <motion.div
          className="loader-orbit orbit-c"
          animate={{ rotate: 360 }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "linear",
          }}
        />

        {/* MAIN SHIELD */}

        <motion.div
          className="loader-logo"
          animate={{
            scale: [1, 1.06, 1],
            boxShadow: [
              "0 0 25px rgba(59,130,246,0.2)",
              "0 0 65px rgba(59,130,246,0.55)",
              "0 0 25px rgba(59,130,246,0.2)",
            ],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <ShieldCheck size={66} strokeWidth={1.4} />
        </motion.div>

        {/* SCANNING EFFECT */}

        <motion.div
          className="loader-scanner"
          animate={{
            y: [-65, 65, -65],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <ScanLine size={20} />
        </motion.div>

        {/* BRAND */}

        <motion.div
          className="loader-brand"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h1>NexusClaim</h1>
          <p>INTELLIGENCE BEYOND EVERY CLAIM</p>
        </motion.div>

        {/* STATUS */}

        <div className="loader-status">
          <BrainCircuit size={19} />

          <AnimateMessage message={messages[messageIndex]} />
        </div>

        {/* PROGRESS */}

        <div className="loader-progress">
          <div className="progress-heading">
            <span>SECURE WORKSPACE INITIALIZATION</span>
            <span>{progress}%</span>
          </div>

          <div className="progress-track">
            <motion.div
              className="progress-fill"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.15 }}
            />
          </div>
        </div>

        {/* SECURITY */}

        <div className="loader-security">
          <LockKeyhole size={15} />
          SECURE SESSION INITIALIZATION
        </div>

      </div>

      <div className="loader-footer">
        POWERED BY NEXUSCLAIM INTELLIGENCE
      </div>

    </motion.main>
  );
}

// ANIMATED STATUS MESSAGE

function AnimateMessage({ message }: { message: string }) {
  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={message}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.25 }}
      >
        {message}
      </motion.span>
    </AnimatePresence>
  );
}

export default LoadingScreen;