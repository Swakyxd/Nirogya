'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

const GetStartedPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    symptoms: ''
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle form submission here
    console.log('Form submitted:', formData)
    // You can add logic to process the form data
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b-2 border-primary-200">
        <div className="w-full px-4 py-4">
          <Link href="/" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 hover:bg-primary-600 group">
            <span className="text-primary-600 font-semibold group-hover:text-white transition-colors duration-300">← Back to Home</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-container padding-container py-16">
        <div className="max-w-4xl mx-auto">
          {/* Welcome Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-100 rounded-full mb-6">
              <Image src="/user.svg" alt="User" width={32} height={32} className="text-primary-600" />
            </div>
            <h1 className="bold-40 lg:bold-52 text-gray-90 mb-4">
              We're Here to Help You
            </h1>
            <p className="regular-18 text-gray-50 max-w-2xl mx-auto mb-2">
              Your health and well-being matter to us. Please share some basic information 
              so we can provide you with the most relevant guidance and support.
            </p>
            <p className="regular-16 text-primary-600 italic">
              Feel free to be as detailed or as brief as you're comfortable with. 
              Every piece of information helps us serve you better.
            </p>
          </div>

          {/* Form Section */}
          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Name Field */}
              <div>
                <label htmlFor="name" className="block bold-18 text-gray-90 mb-3">
                  What should we call you? 
                  <span className="regular-16 text-gray-50 font-normal ml-2">(First name is perfectly fine)</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter your name..."
                  className="w-full px-6 py-4 border-2 border-primary-200 rounded-xl focus:border-primary-400 focus:outline-none transition-colors regular-16 bg-gray-10"
                  required
                />
              </div>

              {/* Symptoms Field */}
              <div>
                <label htmlFor="symptoms" className="block bold-18 text-gray-90 mb-3">
                  How are you feeling? 
                  <span className="regular-16 text-gray-50 font-normal ml-2">(Describe any symptoms or concerns)</span>
                </label>
                <div className="mb-4">
                  <p className="regular-14 text-gray-50 mb-2">You can mention things like:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-primary-600">
                    <span>• Stomach pain or discomfort</span>
                    <span>• Nausea or vomiting</span>
                    <span>• Diarrhea or digestive issues</span>
                    <span>• Fever or chills</span>
                    <span>• Fatigue or weakness</span>
                    <span>• Headaches</span>
                    <span>• Any other concerns</span>
                    <span>• Recent water/food consumption</span>
                  </div>
                </div>
                <textarea
                  id="symptoms"
                  name="symptoms"
                  value={formData.symptoms}
                  onChange={handleInputChange}
                  placeholder="Take your time to describe how you're feeling. There's no rush, and you can be as detailed or brief as you'd like..."
                  rows={8}
                  className="w-full px-6 py-4 border-2 border-primary-200 rounded-xl focus:border-primary-400 focus:outline-none transition-colors regular-16 bg-gray-10 resize-none"
                  required
                />
                <p className="regular-14 text-gray-50 mt-2 italic">
                  Remember: This information helps us provide better guidance, but it's not a substitute for professional medical advice.
                </p>
              </div>

              {/* Submit Button */}
              <div className="text-center pt-6">
                <button
                  type="submit"
                  className="bg-primary-500 hover:bg-primary-600 text-white px-12 py-4 rounded-xl bold-16 transition-all transform hover:scale-105 shadow-lg"
                >
                  Get Personalized Guidance
                </button>
                <p className="regular-14 text-gray-50 mt-4">
                  We'll analyze your information and provide helpful resources and recommendations.
                </p>
              </div>
            </form>
          </div>

          {/* Reassurance Section */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-white rounded-xl shadow-sm">
              <div className="w-12 h-12 bg-success-50 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl">🔒</span>
              </div>
              <h3 className="bold-16 text-gray-90 mb-2">Private & Secure</h3>
              <p className="regular-14 text-gray-50">Your information is kept confidential and secure</p>
            </div>
            <div className="text-center p-6 bg-white rounded-xl shadow-sm">
              <div className="w-12 h-12 bg-primary-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl">💙</span>
              </div>
              <h3 className="bold-16 text-gray-90 mb-2">Caring Support</h3>
              <p className="regular-14 text-gray-50">We're here to help with compassion and understanding</p>
            </div>
            <div className="text-center p-6 bg-white rounded-xl shadow-sm">
              <div className="w-12 h-12 bg-accent-50 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="bold-16 text-gray-90 mb-2">Quick Response</h3>
              <p className="regular-14 text-gray-50">Get immediate guidance and next steps</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default GetStartedPage
