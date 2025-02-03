"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { loadingMessages } from "../loading-messages"
import { Search, FileText, Target, Fingerprint, Scale, MicroscopeIcon } from "lucide-react"

const icons = [Search, FileText, Target, Fingerprint, Scale, MicroscopeIcon]

export function LoadingAnimation() {
  const [messageIndex, setMessageIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % loadingMessages.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex flex-col items-center justify-center space-y-12">
      <AnimatePresence mode="wait">
        <motion.div
          key={messageIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
          className="text-lg text-primary/90 text-center h-8"
        >
          {loadingMessages[messageIndex]}
        </motion.div>
      </AnimatePresence>

      <div className="relative w-48 h-48">
        {/* Single rotating ring with evenly spaced icons */}
        <motion.div
          className="absolute inset-0"
          animate={{ rotate: 360 }}
          transition={{ duration: 10, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
        >
          {icons.map((Icon, index) => {
            const angle = (index * 360) / icons.length
            const radius = 80 // Adjust this value to change the circle size
            const x = Math.cos((angle * Math.PI) / 180) * radius
            const y = Math.sin((angle * Math.PI) / 180) * radius

            return (
              <div
                key={index}
                className="absolute"
                style={{
                  transform: `translate(${x}px, ${y}px)`,
                  left: "50%",
                  top: "50%",
                }}
              >
                <Icon className="w-6 h-6 text-primary/80 transform -translate-x-1/2 -translate-y-1/2" />
              </div>
            )
          })}
        </motion.div>
      </div>
    </div>
  )
}

