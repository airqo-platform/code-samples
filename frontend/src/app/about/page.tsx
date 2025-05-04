"use client"

import { Suspense } from "react"
import { FeatureCard } from "@/components/feature-card"
import { Users, HeartHandshake, Ruler, Share2, Mail, Phone, MapPin, Twitter, Linkedin , Link} from "lucide-react"
import Navigation from "@/components/navigation/navigation"

function AboutContent() {
  return (
    <div className="container mx-auto px-4 py-8 h-full overflow-y-auto">
      <h1 className="text-4xl font-bold mb-8 text-center">About AirQo</h1>

      <div className="mb-12 text-justify">
        <p className="text-lg mb-4">
          AirQo is a pioneering initiative dedicated to improving air quality monitoring and management across Africa.
          <strong>
            Our mission is to efficiently collect, analyze and forecast air quality data to international standards and
            work with partners to reduce air pollution and raise awareness of its effects in African cities.
          </strong>
        </p>
        <p className="text-lg font-light">
          Founded in 2015 at Makerere University in Uganda, AirQo has grown into a multidisciplinary team of engineers,
          data scientists, and environmental experts. We are committed to developing innovative, low-cost air quality
          monitoring solutions tailored for the unique challenges of African urban environments.
        </p>
        <br></br>
        <p className="text-lg font-light">
          For more information, visit our <a href="https://airqo.net/about-us" className="text-blue-600 hover:underline" target="_blank">About Us</a> page at  
          <a href="https://airqo.net" className="text-blue-600 hover:underline" target="_blank"> airqo.net</a>.
        </p>
      </div>

      <h2 className="text-3xl font-semibold mb-6 text-center">Our Core Values</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
        <FeatureCard
          title="Citizen Focus"
          description="At AirQo, we believe that the main beneficiary of our work should be the citizen."
          Icon={HeartHandshake}
          imageSrc="/images/model/citizenfocused1.webp"
          href="https://airqo.net/about-us"
          openInNewTab={true}
        />
        <FeatureCard
          title="Precision"
          description="We convert low-cost sensor data into a reliable measure of air quality thus making our network and our models as accurate as they can be."
          Icon={Ruler}
          imageSrc="/images/model/precision.webp"
          href="https://airqo.net/about-us"
          openInNewTab={true}
        />
        <FeatureCard
          title="Collaboration and Openness"
          description="We work in a fast-moving field with continuous improvements in technology. We recruit the best teams and also commit to their ongoing professional development and training."
          Icon={Share2}
          imageSrc="/images/model/peoplefocused.webp"
          href="https://airqo.net/about-us"
          openInNewTab={true}
        />
        <FeatureCard
          title="Investment in People"
          description="We invest in the best talent and commit to their ongoing development and training."
          Icon={Users}
          imageSrc="/images/model/invest.webp"
          href="https://airqo.net/about-us"
          openInNewTab={true}
        />
      </div>

      <div className="bg-blue-50 p-8 rounded-lg mb-12">
        <h2 className="text-2xl font-semibold mb-4">Our Impact</h2>
        <ul className="list-disc list-inside space-y-2">
          <li>Deployed over 300 low-cost air quality sensors across Africa</li>
          <li>Provided air quality data to millions of citizens through our digital platform and API</li>
          <li>Collaborated with local governments to develop data-driven air quality management strategies</li>
          <li>Engaged in capacity building, training over 5000 individuals in air quality monitoring and analysis.</li>
        </ul>
      </div>

      {/* Updated Get in Touch Section with Full Address */}
      <div className="bg-blue-50 p-8 rounded-lg mb-12">
        <h2 className="text-3xl font-semibold mb-6 text-center">Get in Touch</h2>
        <p className="text-center text-gray-600 mb-8">
          We&apos;d love to hear from you! Reach out with questions, feedback, or collaboration ideas.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Contact Information */}
          <div>
            <h3 className="text-xl font-medium mb-4 text-center md:text-left">Contact Information</h3>
            <div className="space-y-4">
              {/* website airqo.net */}
              <div className="flex items-center justify-center md:justify-start">
                <Link className="w-5 h-5 mr-2 text-blue-600 flex-shrink-0"  />
                <a href="https://airqo.net" className="text-blue-600 hover:underline" target="_blank">
                  airqo.net
                </a>
              </div>
              {/* email */}
              <div className="flex items-center justify-center md:justify-start">
                <Mail className="w-5 h-5 mr-2 text-blue-600 flex-shrink-0" />
                <a href="mailto:info@airqo.net" className="text-blue-600 hover:underline">
                  info@airqo.net
                </a>
              </div>
              {/* phone */}
              <div className="flex items-center justify-center md:justify-start">
                <Phone className="w-5 h-5 mr-2 text-blue-600 flex-shrink-0" />
                <a href="tel:+256 786 142 396" className="text-blue-600 hover:underline">
                  +256 786 142 396
                </a>
              </div>
              <div className="flex items-start justify-center md:justify-start">
                <MapPin className="w-5 h-5 mr-2 text-blue-600 flex-shrink-0 mt-1" />
                <span className="text-gray-700">
                  Makerere University
                  <br />
                  Software Systems Centre, Block B, Level 3
                  <br />
                  College of Computing and Information Sciences
                  <br />
                  Plot 56 University Pool Road
                  <br />
                  Kampala, Uganda
                </span>
              </div>
            </div>
          </div>

          {/* Social Media */}
          <div>
            <h3 className="text-xl font-medium mb-4 text-center md:text-left">Connect With Us</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-center md:justify-start">
                <Twitter  className="w-5 h-5 mr-2 text-blue-600 flex-shrink-0" />
                <a
                  href="https://twitter.com/AirQoProject"
                  className="text-blue-600 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  @AirQoProject
                </a>
              </div>

              <div className="flex items-center justify-center md:justify-start">
                <Linkedin className="w-5 h-5 mr-2 text-blue-600 flex-shrink-0" />
                <a
                  href="https://www.linkedin.com/company/airqo/posts/?feedView=all"
                  className="text-blue-600 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  AirQo
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AboutPage() {
  return (
    <div>
      <Suspense fallback={<div>Loading navigation...</div>}>
        <Navigation />
      </Suspense>
      <Suspense fallback={<div>Loading content...</div>}>
        <AboutContent />
      </Suspense>
    </div>
  )
}
