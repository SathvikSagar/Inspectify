import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Navigation, Autoplay, EffectCoverflow } from 'swiper/modules';
import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import 'swiper/css/effect-coverflow';

const testimonials = [
  {
    id: 1,
    rating: 5,
    text: 'Inspectify has completely transformed how we manage road inspections. The detection accuracy saves us hours of manual work and has improved our maintenance planning by 40%.',
    name: 'Navatha Singh',
    role: 'City Infrastructure Manager',
    image: 'https://randomuser.me/api/portraits/women/44.jpg',
    company: 'Metro City Department',
    highlight: 'Reduced inspection time by 70%'
  },
  {
    id: 2,
    rating: 5,
    text: 'The severity classification and prioritization features are a game-changer. Inspectify helped us reduce downtime efficiently and allocate our resources to the most critical repairs first.',
    name: 'Venkat Kumar',
    role: 'Highway Maintenance Director',
    image: 'https://randomuser.me/api/portraits/men/32.jpg',
    company: 'State Highway Authority',
    highlight: 'Improved repair prioritization'
  },
  {
    id: 3,
    rating: 5,
    text: 'From smart damage insights to clean summaries, everything is intuitive. Highly recommended for infrastructure planning. The AI detection is remarkably accurate even in challenging weather conditions.',
    name: 'Rushika Patel',
    role: 'Urban Planning Specialist',
    image: "https://randomuser.me/api/portraits/women/68.jpg",
    company: 'Urban Development Corp',
    highlight: 'Seamless integration with existing systems'
  },
  {
    id: 4,
    rating: 5,
    text: 'The platform helped me manage field reports better. The clean UI and fast analysis are perfect for our operations. We can now inspect twice the road surface with the same team size.',
    name: 'Shanti Reddy',
    role: 'Operations Manager',
    image: "https://randomuser.me/api/portraits/women/79.jpg",
    company: 'Regional Transport Office',
    highlight: 'Doubled inspection coverage'
  },
  {
    id: 5,
    rating: 5,
    text: 'It brought automation to our workflow. We now understand road safety trends better and faster. This tool has revolutionized how we approach preventative maintenance.',
    name: 'Shiva Prasad',
    role: 'Chief Technology Officer',
    image: "https://randomuser.me/api/portraits/men/54.jpg",
    company: 'Smart City Solutions',
    highlight: 'Data-driven maintenance decisions'
  },
];

const fallbackAvatar =
  'https://ui-avatars.com/api/?name=User&background=CBD5E1&color=1E293B&size=128';

const Testimonials = () => {
  return (
    <section className="relative bg-gradient-to-b from-white via-green-50 to-white py-24 overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-green-50 to-transparent opacity-70"></div>
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-green-100 rounded-full opacity-20 blur-3xl"></div>
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-teal-100 rounded-full opacity-20 blur-3xl"></div>
      
      <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-block mb-3">
            <span className="bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent text-sm font-semibold tracking-wider uppercase px-3 py-1 rounded-full border border-green-200">
              Testimonials
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight mb-4">
            What Our Users Say
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Real stories from people improving road safety and operations with our AI-powered inspection platform.
          </p>
        </motion.div>

        {/* Large quote icon */}
        <div className="absolute top-40 left-0 opacity-5 z-0">

          <Quote size={300} />
        </div>

        <Swiper
          modules={[Pagination, Navigation, Autoplay, EffectCoverflow]}
          effect="coverflow"
          coverflowEffect={{
            rotate: 0,
            stretch: 0,
            depth: 100,
            modifier: 1,
            slideShadows: false,
          }}
          spaceBetween={30}
          slidesPerView={1}
          centeredSlides={true}
          loop={true}
          autoplay={{
            delay: 5000,
            disableOnInteraction: false,
          }}
          pagination={{ 
            clickable: true,
            dynamicBullets: true
          }}
          navigation={{ clickable: true }}
          breakpoints={{
            640: { slidesPerView: 1.5 },
            768: { slidesPerView: 2 },
            1024: { slidesPerView: 3 },
          }}
          className="testimonial-swiper"
        >
          {testimonials.map((t, index) => (
            <SwiperSlide key={t.id}>
              <motion.div
                className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 hover:shadow-xl transition-all duration-300 h-full flex flex-col justify-between"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                whileHover={{ y: -5 }}
              >
                {/* Highlight tag */}
                {t.highlight && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-green-600 to-teal-600 text-white text-xs font-bold px-4 py-1 rounded-full shadow-md">
                    {t.highlight}
                  </div>
                )}
                
                {/* Rating */}
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} size={16} className="text-yellow-400 fill-yellow-400" />
                  ))}
                  <span className="ml-2 text-sm font-semibold text-gray-600">
                    5.0
                  </span>
                </div>

                {/* Quote icon */}
                <div className="mb-4 text-green-100">
                  <Quote size={40} className="opacity-50" />
                </div>

                {/* Testimonial text */}
                <p className="text-gray-700 text-base mb-6 leading-relaxed">
                  {t.text}
                </p>

                {/* User info */}
                <div className="flex items-center gap-4 pt-4 mt-auto border-t border-gray-100">
                  <img
                    className="w-14 h-14 rounded-full object-cover border-2 border-green-100 shadow-sm"
                    src={t.image}
                    alt={t.name}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = fallbackAvatar;
                    }}
                  />
                  <div>
                    <p className="font-bold text-gray-900">{t.name}</p>
                    <p className="text-sm text-gray-500">{t.role}</p>
                    <p className="text-xs text-green-600 mt-1">{t.company}</p>
                  </div>
                </div>
              </motion.div>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Featured testimonial */}
        <motion.div 
          className="mt-20 max-w-4xl mx-auto bg-gradient-to-r from-green-50 to-teal-50 rounded-3xl p-10 shadow-lg border border-green-100 relative overflow-hidden"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <div className="absolute -right-10 -bottom-10 opacity-10">
            <Quote size={200} />
          </div>
          
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="md:w-1/3 flex-shrink-0">
                <img 
                  src="https://randomuser.me/api/portraits/men/42.jpg" 
                  alt="Featured testimonial" 
                  className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-white shadow-xl mx-auto"
                />
              </div>
              <div className="md:w-2/3">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={20} className="text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 text-lg italic mb-6">
                  "The AI detection accuracy is remarkable. We've reduced our inspection costs by 60% while increasing the frequency of our road assessments. This technology is truly transformative for urban infrastructure management."
                </p>
                <div>
                  <p className="font-bold text-gray-900 text-lg">Mr. Satvik Mehta</p>
                  <p className="text-green-700">Director of Infrastructure, National Highways Authority</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <style>{`
          .swiper-pagination {
            margin-top: 3rem;
            position: relative;
            bottom: 0 !important;
          }
          .swiper-pagination-bullet {
            width: 10px;
            height: 10px;
            background-color: #e2e8f0;
            margin: 0 6px;
            border-radius: 50%;
            transition: all 0.3s ease;
            opacity: 0.5;
          }
          .swiper-pagination-bullet-active {
            background-color: #10b981;
            opacity: 1;
            width: 12px;
            height: 12px;
          }
          .swiper-button-next,
          .swiper-button-prev {
            color: #10b981;
            background-color: white;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            transition: all 0.3s ease;
          }
          .swiper-button-next:hover,
          .swiper-button-prev:hover {
            background-color: #10b981;
            color: white;
          }
          .swiper-button-next:after,
          .swiper-button-prev:after {
            font-size: 18px;
            font-weight: bold;
          }
          .testimonial-swiper {
            padding: 30px 10px 60px;
          }
        `}</style>
      </div>
    </section>
  );
};

export default Testimonials;
