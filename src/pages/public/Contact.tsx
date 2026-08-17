import { useState } from 'react';
import { Phone, Mail, MapPin, Send, MessageSquare, Bot, Compass, AlertCircle } from 'lucide-react';
import { sendContactMessage } from '@/lib/contactService';

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await sendContactMessage(form);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send message. Please try again or call us directly.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-sand-50/50 min-h-screen">
      {/* Full-Width Image Banner Section */}
      <section className="relative bg-cocoa-800 py-20 lg:py-28 overflow-hidden border-b border-sand-200">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1920&q=80"
            alt="Customer Concierge Banner"
            className="w-full h-full object-cover object-center opacity-30 scale-105 transition-transform duration-1000 hover:scale-100"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-cocoa-900 via-cocoa-800/90 to-transparent" />
        </div>

        <div className="page-container relative z-10">
          <div className="max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-semibold shadow-inner transition-all hover:bg-white/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
              </span>
              <MessageSquare size={14} className="text-teal-300" />
              <span>Concierge Desk Live</span>
            </div>

            <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-white tracking-tight">
              Get in Touch with Us
            </h1>
            <p className="text-base sm:text-lg text-sand-200 leading-relaxed">
              Have questions about experiences, luxury villas, or private transfers in Diani? Our concierge team is standing by to assist you.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content: Info & Form */}
      <section className="page-container py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Contact Details Column */}
          <div className="lg:col-span-1 space-y-5">
            {/* Phone Card */}
            <div className="group card p-6 flex items-start gap-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg border border-sand-200/80 hover:border-coral-200 bg-white">
              <div className="w-12 h-12 rounded-xl bg-coral-50 flex items-center justify-center flex-shrink-0 group-hover:bg-coral-600 group-hover:text-white transition-colors duration-300 text-coral-600 shadow-sm">
                <Phone size={22} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-cocoa-700 group-hover:text-coral-600 transition-colors">Call Us Directly</h3>
                <a href="tel:+254714446328" className="text-sm font-medium text-teal-700 hover:underline block mt-1">
                  +254 714 446 328
                </a>
                <span className="text-xs text-slate-400 mt-1 block">Mon–Sun 8am - 10pm EAT</span>
              </div>
            </div>

            {/* Email Card */}
            <div className="group card p-6 flex items-start gap-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg border border-sand-200/80 hover:border-teal-200 bg-white">
              <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center flex-shrink-0 group-hover:bg-teal-600 group-hover:text-white transition-colors duration-300 text-teal-600 shadow-sm">
                <Mail size={22} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-cocoa-700 group-hover:text-teal-700 transition-colors">Email Us</h3>
                <a href="mailto:putukenya06@gmail.com" className="text-sm font-medium text-teal-700 hover:underline block mt-1">
                  putukenya06@gmail.com
                </a>
                <span className="text-xs text-slate-400 mt-1 block">For detailed itineraries & quotes</span>
              </div>
            </div>

            {/* Visit Card */}
            <div className="group card p-6 flex items-start gap-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg border border-sand-200/80 hover:border-cocoa-200 bg-white">
              <div className="w-12 h-12 rounded-xl bg-sand-100 flex items-center justify-center flex-shrink-0 group-hover:bg-cocoa-700 group-hover:text-white transition-colors duration-300 text-cocoa-700 shadow-sm">
                <MapPin size={22} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-cocoa-700 group-hover:text-cocoa-800 transition-colors">Visit Our Office</h3>
                <p className="text-sm text-slate-600 mt-1">Diani Beach Road, Kwale County, Kenya</p>
              </div>
            </div>

            {/* Interactive Assistance Widget */}
            <div className="group card p-6 bg-gradient-to-br from-teal-50/80 via-sand-50 to-coral-50/30 border border-teal-200/60 transition-all duration-300 hover:shadow-xl hover:border-teal-300 relative overflow-hidden">
              <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-teal-500/10 rounded-full blur-xl group-hover:bg-teal-500/20 transition-all" />
              
              <div className="flex items-center gap-3 mb-2.5">
                <div className="p-2 rounded-lg bg-teal-100 text-teal-700 group-hover:rotate-12 transition-transform duration-300">
                  <Bot size={20} />
                </div>
                <h4 className="text-sm font-semibold text-cocoa-700">Need Immediate Help?</h4>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Our local guides and travel concierges are available to provide custom trip guidance and instant assistance.
              </p>
              <div className="mt-4 pt-3 border-t border-teal-100/80 flex items-center justify-between text-xs font-semibold text-teal-700 group-hover:text-teal-800">
                <span className="flex items-center gap-1"><Compass size={14} /> Local Concierge</span>
                <span className="text-coral-600">Online &bull;</span>
              </div>
            </div>
          </div>

          {/* Form Column */}
          <div className="lg:col-span-2">
            <div className="card-md p-8 bg-white border border-sand-200/80 shadow-sm transition-shadow duration-300 hover:shadow-md">
              {submitted ? (
                <div className="text-center py-12 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center mx-auto text-teal-600 animate-pulse">
                    <Send size={28} />
                  </div>
                  <h3 className="font-serif text-2xl font-semibold text-cocoa-700">Message Received</h3>
                  <p className="text-sm text-slate-500 max-w-md mx-auto">
                    Thank you for contacting us. We have safely saved your message and our team at <span className="font-semibold text-teal-700">putukenya06@gmail.com</span> will reach back promptly.
                  </p>
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setForm({ name: '', email: '', phone: '', message: '' });
                    }}
                    className="btn-secondary mt-4 inline-flex items-center gap-2 hover:bg-sand-200"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="border-b border-sand-200 pb-4 mb-2">
                    <h2 className="font-serif text-2xl font-semibold text-cocoa-700">Send a Message</h2>
                    <p className="text-xs text-slate-500 mt-1">Fill out the details below and our concierge desk will respond promptly.</p>
                  </div>

                  {error && (
                    <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                      <AlertCircle size={16} className="flex-shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div>
                    <label className="label" htmlFor="name">Full Name</label>
                    <input
                      id="name"
                      className="input transition-all duration-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                      required
                      placeholder="e.g. Emoni Samuel"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="label" htmlFor="email">Email Address</label>
                      <input
                        id="email"
                        type="email"
                        className="input transition-all duration-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                        required
                        placeholder="emoni@example.com"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="label" htmlFor="phone">Phone Number</label>
                      <input
                        id="phone"
                        className="input transition-all duration-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                        placeholder="+254 700 000 000"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="label" htmlFor="message">Message</label>
                    <textarea
                      id="message"
                      rows={5}
                      className="input transition-all duration-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                      required
                      placeholder="Tell us about your holiday plans or inquiries..."
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary group w-full sm:w-auto inline-flex items-center justify-center gap-2 hover:shadow-lg transition-all duration-300 hover:scale-[1.01] disabled:opacity-50"
                  >
                    <span>{loading ? 'Sending...' : 'Send Message'}</span>
                    <Send size={16} className="transition-transform group-hover:translate-x-1" />
                  </button>
                </form>
              )}
            </div>
          </div>

        </div>
      </section>

      {/* Embedded Google Map Section */}
      <section className="page-container pb-16">
        <div className="card-md overflow-hidden p-2 bg-white border border-sand-200/80 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="p-4 flex items-center justify-between border-b border-sand-200 bg-sand-50/50">
            <div className="flex items-center gap-2">
              <MapPin size={18} className="text-coral-600 animate-bounce" />
              <span className="font-semibold text-cocoa-700 text-sm">Our Location in Diani, Kenya</span>
            </div>
            <span className="text-xs text-slate-400 font-medium">Interactive Map</span>
          </div>
          <div className="w-full h-80 sm:h-96 rounded-lg overflow-hidden">
            <iframe
              title="Diani Map Location"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3978.852158913308!2d39.5768513!3d-4.2882875!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x18404396b2df1529%3A0xb35a0f1d533fa1f2!2sDiani%20Beach!5e0!3m2!1sen!2ske!4v1700000000000!5m2!1sen!2ske"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen={false}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </section>
    </div>
  );
}