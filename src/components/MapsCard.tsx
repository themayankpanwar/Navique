import { Map as MapIcon, MapPin, Navigation, ExternalLink } from 'lucide-react';

// Google Maps embed — no API key required for the basic embed endpoint.
export default function MapsCard({ destination }: { destination: string }) {
  const query = encodeURIComponent(destination);
  const embedSrc = `https://www.google.com/maps?q=${query}&output=embed`;
  const directionsLink = `https://www.google.com/maps/search/?api=1&query=${query}`;
  const attractionsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    'things to do near ' + destination,
  )}`;

  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-2 mb-4">
        <MapIcon className="w-5 h-5 text-brand-600 dark:text-brand-400" />
        <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">Destination map</h3>
      </div>

      <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 mb-4 aspect-video">
        <iframe
          title={`Map of ${destination}`}
          src={embedSrc}
          className="w-full h-full"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <a
          href={directionsLink}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-outline flex-1 text-sm"
        >
          <MapPin className="w-4 h-4" /> View on Google Maps
          <ExternalLink className="w-3.5 h-3.5 opacity-60" />
        </a>
        <a
          href={attractionsLink}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-outline flex-1 text-sm"
        >
          <Navigation className="w-4 h-4" /> Nearby attractions
          <ExternalLink className="w-3.5 h-3.5 opacity-60" />
        </a>
      </div>
    </div>
  );
}
