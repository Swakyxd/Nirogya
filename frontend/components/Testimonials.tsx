import React from 'react'
import Image from 'next/image'

const Testimonials = () => {
  const testimonials = [
    {
      name: "",
      role: "",
      image: "/person-1.png",
      quote: ""
    },
    {
      name: "",
      role: "",
      image: "/person-2.png",
      quote: ""
    },
    {
      name: "",
      role: "",
      image: "/person-3.png",
      quote: ""
    }
  ]

  return (
    <section id="testimonials" className="bg-gray-10 py-20">
      <div className="max-container padding-container">
        <div className="text-left mb-16">
          <h2 className="bold-40 lg:bold-52 text-gray-90 mb-6">
            Testimonials
          </h2>
          <p className="regular-16 text-gray-50 max-w-2xl">
            Real stories and experiences from our community members and healthcare professionals.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-white rounded-2xl p-8 relative shadow-lg hover:shadow-xl transition-all border border-primary-100 min-h-[300px]">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-6">
                <Image
                  src="/quote.svg"
                  alt="Quote"
                  width={20}
                  height={20}
                  className="text-primary-600"
                />
              </div>
              <div className="mb-6 h-24 flex items-center justify-center">
                <p className="regular-16 text-gray-300 italic text-center">
                  Testimonial content will be added here
                </p>
              </div>
              <div className="flex items-center gap-4 absolute bottom-8 left-8 right-8">
                <div className="relative">
                  <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-primary-400 rounded-full border-2 border-white"></div>
                </div>
                <div>
                  <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                  <div className="h-3 bg-gray-100 rounded w-32"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Testimonials
