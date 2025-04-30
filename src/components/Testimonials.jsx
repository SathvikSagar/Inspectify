import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation'; // Import the necessary styles for navigation

const testimonials = [
  {
    id: 1,
    rating: '4.9',
    text: 'Inspectify has completely transformed how we manage road inspections. The damage detection accuracy is impressive save us hours of manual work.',
    name: 'Navatha',
    role: 'Admin',
    image: 'https://pagedone.io/asset/uploads/1696229969.png',
  },
  {
    id: 2,
    rating: '4.9',
    text: 'The severity classification and repair prioritization features are a game-changer. Inspectify helped us reduce downtime and allocate resources more effectively.',
    name: 'Venkat D',
    role: 'User',
    image: 'https://pagedone.io/asset/uploads/1696229994.png',
  },
  {
    id: 3,
    rating: '4.9',
    text: 'From smart damage insights to clean visual summaries, everything is intuitive and reliable. Highly recommended for anyone in road safety and infrastructure planning.',
    name: 'Rushika A',
    role: 'User',
    image: 'https://pagedone.io/asset/uploads/1696230036.png',
  },
  {
    id: 4,
    rating: '4.9',
    text: 'This platform helped me understand market trends and manage my portfolio effectively.From smart damage insights to clean visual summaries, everything is intuitive',
    name: 'Santhi',
    role: 'Marketing Lead',
    image: 'https://pagedone.io/asset/uploads/1696230036.png',
  },
  {
    id: 5,
    rating: '4.9',
    text: 'From smart damage insights to clean visual summaries, everything is intuitiveThis platform helped me understand market trends and manage my portfolio effectively.',
    name: 'Shiva',
    role: 'Marketing Lead',
    image: 'https://pagedone.io/asset/uploads/1696230036.png',
  },
];

const Testimonials = () => {
  return (
    <section className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          {/* <span className="text-sm text-green-500 font-medium block mb-2">TESTIMONIAL</span> */}
          <h2 className="text-4xl font-bold text-green-900">What our happy users say!</h2>
        </div>

        <Swiper 
          modules={[Pagination, Navigation]}
          spaceBetween={30}
          slidesPerView={1}
          pagination={{ clickable: true }}
          navigation={{ clickable: true }}  // Enable navigation arrows
          breakpoints={{
            768: { slidesPerView: 2 },
            1024: { slidesPerView: 3 },
          }}
          className="relative px-12"
       >
          {testimonials.map((testimonial) => (
            <SwiperSlide key={testimonial.id}>
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition">
                <div className="flex items-center gap-2 mb-4 text-amber-500">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 18 17">
                    <path d="M8.1 1.3c.4-.7 1.5-.7 1.8 0l1.8 3.7c.1.3.4.5.7.6l4 .6c.8.1 1.2 1 .6 1.6l-2.9 2.9c-.2.2-.3.6-.3.9l.7 4c.1.8-.7 1.4-1.4 1l-3.6-1.9c-.3-.1-.7-.1-1 0l-3.6 1.9c-.7.4-1.5-.2-1.4-1l.7-4c.1-.3 0-.7-.3-.9L.9 7.8c-.6-.6-.3-1.5.6-1.6l4-.6c.3 0 .6-.3.7-.6L8.1 1.3z" />
                  </svg>
                  <span className="text-base font-semibold text-indigo-600">{testimonial.rating}</span>
                </div>
                <p className="text-gray-600 mb-6">{testimonial.text}</p>
                <div className="flex items-center gap-4 border-t pt-4">
                  <img
                    className="w-10 h-10 rounded-full object-cover"
                    src={testimonial.image}
                    alt={testimonial.name}
                  />
                  <div>
                    <p className="font-medium text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Swiper pagination custom styles */}
        <style>{`
          .swiper-pagination {
            margin-top: 2rem;
            text-align: center;
          }
          .swiper-pagination-bullet {
            width: 16px;
            height: 4px;
            background-color: #d1d5db;
            margin: 0 6px;
            border-radius: 5px;
            transition: background-color 0.3s ease;
          }
          .swiper-pagination-bullet-active {
            background-color:rgb(22, 205, 153);
          }

          /* Custom navigation buttons */
          .swiper-button-next, .swiper-button-prev {
            color:rgb(65, 240, 117);
            font-size: 1.5rem;
            transition: color 0.3s ease;
          }
          .swiper-button-next:hover, .swiper-button-prev:hover {
            color: #2C3E50;
          }
            .swiper-button-next {
  right: -10px; /* push arrow further right */
}
.swiper-button-prev {
  left: -10px;  /* push arrow further left */
}

        `}</style>
      </div>
    </section>
  );
};

export default Testimonials;
