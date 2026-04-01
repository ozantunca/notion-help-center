import React, { useState } from 'react';
import Head from 'next/head';
import Script from 'next/script';
import Link from 'next/link';
import { Header } from './Layout/Header';
import { Footer } from './Layout/Footer';
import type { SiteConfig } from '../lib/site-config';

const CRISP_WEBSITE_ID = process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID;
const FORMSPREE_FORM_ID = process.env.NEXT_PUBLIC_FORMSPREE_FORM_ID;

interface ContactPageProps {
  siteConfig: SiteConfig;
}

export function ContactPage({ siteConfig }: ContactPageProps) {
  const [formSubmitted, setFormSubmitted] = useState(false);
  const supportEmail = siteConfig.supportEmail;
  const suffix = siteConfig.seoTitleSuffix;

  const openCrispChat = () => {
    if (typeof window !== 'undefined' && (window as unknown as { $crisp?: unknown }).$crisp) {
      (window as unknown as { $crisp: { push: (args: unknown[]) => void } }).$crisp.push([
        'do',
        'chat:open',
      ]);
    }
  };

  if (CRISP_WEBSITE_ID) {
    return (
      <>
        <Head>
          <title>{`Contact Us - ${suffix}`}</title>
          <meta
            name="description"
            content={`Get in touch with ${siteConfig.brandName}`}
          />
        </Head>

        <Script
          id="crisp-chat"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.$crisp=[];window.CRISP_WEBSITE_ID="${CRISP_WEBSITE_ID}";
              window.$crisp.push(["do","chat:open"]);
              (function(){var d=document,s=d.createElement("script");
              s.src="https://client.crisp.chat/l.js";
              s.async=1;d.getElementsByTagName("head")[0].appendChild(s);
              })();
            `,
          }}
        />

        <div className="min-h-screen bg-gray-50">
          <Header variant="purple" showSearch />

          <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <nav className="text-sm text-gray-600 mb-6">
              <Link href="/" className="hover:text-primary">
                Home
              </Link>
              <span className="mx-2">›</span>
              <span className="text-gray-900 font-medium">Contact Us</span>
            </nav>

            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                Chat with us
              </h1>
              <p className="text-gray-600 mb-6">
                Our chat should open automatically. If it didn&apos;t, click the
                button below to start a conversation.
              </p>
              <button
                type="button"
                onClick={openCrispChat}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary-hover transition-colors"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                Open chat
              </button>
            </div>
          </main>

          <Footer />
        </div>
      </>
    );
  }

  if (FORMSPREE_FORM_ID) {
    return (
      <>
        <Head>
          <title>{`Contact Us - ${suffix}`}</title>
          <meta
            name="description"
            content={`Get in touch with ${siteConfig.brandName}`}
          />
        </Head>

        <div className="min-h-screen bg-gray-50">
          <Header variant="purple" showSearch />

          <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <nav className="text-sm text-gray-600 mb-6">
              <Link href="/" className="hover:text-primary">
                Home
              </Link>
              <span className="mx-2">›</span>
              <span className="text-gray-900 font-medium">Contact Us</span>
            </nav>

            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                Send us a message
              </h1>

              {formSubmitted ? (
                <p className="text-gray-600">
                  Thank you for your message. We&apos;ll get back to you soon.
                </p>
              ) : (
                <form
                  action={`https://formspree.io/f/${FORMSPREE_FORM_ID}`}
                  method="POST"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    const res = await fetch(form.action, {
                      method: 'POST',
                      body: new FormData(form),
                      headers: { Accept: 'application/json' },
                    });
                    if (res.ok) setFormSubmitted(true);
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      className="block w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      className="block w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="message"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Message
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={4}
                      required
                      className="block w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary-hover transition-colors"
                  >
                    Send message
                  </button>
                </form>
              )}
            </div>
          </main>

          <Footer />
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{`Contact Us - ${suffix}`}</title>
        <meta
          name="description"
          content={`Get in touch with ${siteConfig.brandName}`}
        />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <Header variant="purple" showSearch />

        <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <nav className="text-sm text-gray-600 mb-6">
            <Link href="/" className="hover:text-primary">
              Home
            </Link>
            <span className="mx-2">›</span>
            <span className="text-gray-900 font-medium">Contact Us</span>
          </nav>

          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Contact Us
            </h1>
            <p className="text-gray-600 mb-6">
              Reach out to us by email. We&apos;ll get back to you as soon as
              possible.
            </p>
            <a
              href={`mailto:${supportEmail}?subject=${encodeURIComponent(`${siteConfig.brandName} — contact`)}`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary-hover transition-colors"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              Email us
            </a>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}
