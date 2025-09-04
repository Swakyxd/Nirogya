'use client'

import React from 'react'
import Button from './Button'
import Link from 'next/link'
import { motion } from 'framer-motion'

const Intro = () => {
  return (
    <section className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 relative">
        <div className="max-container padding-container flex flex-col gap-12 py-20 md:gap-16 lg:py-32 xl:flex-row items-center">

        <div className='relative z-20 flex flex-1 flex-col xl:w-1/2'>
        <motion.h1
          className="bold-52 lg:bold-64 text-gray-90 mb-4"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
            Waterborne Diseases Awareness
        </motion.h1>

        <motion.p
          className="regular-18 text-primary-600 font-medium mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
            Specialized healthcare guidance for Northeast India
        </motion.p>

        <motion.p
          className="regular-16 text-gray-50 xl:max-w-[520px] mb-8 leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
            Waterborne diseases are illnesses caused by pathogens (such as bacteria, viruses, or parasites) that are transmitted to humans through contaminated water. These diseases can affect various organs and systems in the body, leading to a range of symptoms and health complications. We aim to raise awareness about waterborne diseases and their prevention, with a special focus on the unique challenges faced in Northeast India.
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
            <Link href="/get-started">
              <Button type="button" title="Get Started" variant="btn_primary_dark"/>
            </Link>
            <Button type="button" title="Learn More" variant="btn_white_text"/>
        </motion.div>

        <motion.div
          className="flex items-center gap-6 text-sm text-gray-50"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.0 }}
        >
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-primary-300 rounded-full"></div>
            <span>Symptom Analysis</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-accent-100 rounded-full"></div>
            <span>24/7 Support</span>
          </div>
        </motion.div>
        </div>
        </div>
    </section>
  )
}

export default Intro
