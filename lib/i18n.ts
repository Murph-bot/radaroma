// Host-based locale: radaroma.com serves English, radaroma.gr serves Greek.
// One route tree, no /el prefix — the locale is resolved from the Host header.
// `el` is typed as `typeof en`, so a missing Greek key is a compile error.
import type { MoodId } from "@/lib/moods"
import type { BestForChip } from "@/lib/bestFor"
import type { ScoreAxis } from "@/lib/schemas/score"

export type Locale = "en" | "el"

export function localeFromHost(host: string | null | undefined): Locale {
  if (!host) return "en"
  const h = host.toLowerCase().split(":")[0]
  return h === "radaroma.gr" || h.endsWith(".radaroma.gr") ? "el" : "en"
}

const en = {
  htmlLang: "en",
  nav: {
    cafes: "Cafés",
    compare: "Compare",
    submit: "Submit a café",
    submitShort: "Submit",
    ask: "Ask",
  },
  footer: {
    tagline:
      "Radaroma — a curated, weighted comparison of Attica cafés. Scores are opinions; go taste for yourself.",
    privacy:
      "This site sets no cookies; the admin area signs in through Cloudflare Access. Anonymous visit stats come from Cloudflare Web Analytics, which is cookieless.",
  },
  home: {
    headline: "Attica cafés, as a shape.",
    searchAll: (n: number) => `Search and filter all ${n} cafés →`,
  },
  explorer: {
    heading: "Rank by what matters to you",
    reset: "Reset",
    moodsAria: "Mood presets",
    sliderAria: (axis: string) => `${axis} importance`,
    neighborhood: "Neighborhood",
    price: "Price",
    search: "Search",
    anyPrice: "Any price",
    all: "All",
    searchPlaceholder: "Café name…",
    count: (list: number, total: number) => `${list} of ${total} cafés`,
    empty: "No cafés match these filters.",
  },
  card: {
    match: "match",
    community: "community-submitted, AI-verified",
  },
  cafesPage: {
    title: "Cafés",
    sub: (n: number) => `${n} verified cafés. Adjust the weights to find your kind of place.`,
  },
  detail: {
    allCafes: "← All cafés",
    bestFor: "Best for",
    compareWith: (name: string | null) => `Compare it${name ? ` with ${name}` : ""} →`,
    noScores: "No scores yet — coming soon.",
    scoreBreakdown: "Score breakdown",
    notScored: "Not scored yet.",
    askTitle: "Ask about this café",
    askSub: (name: string) => `Questions about ${name}? The concierge knows its profile.`,
    askPlaceholder: (name: string) => `Ask about ${name}…`,
  },
  compare: {
    title: "Compare",
    sub: "Overlay up to three cafés on one radar chart.",
    pick: (n: number, max: number) => `Pick 2–3 cafés (${n}/${max})`,
    hint: "The link updates as you pick — share it to show this overlay.",
    copied: "Copied",
    copyLink: "Copy link",
    axis: "Axis",
    average: "Average",
    selectTwo: "Select at least two cafés to overlay their radar charts.",
  },
  submit: {
    title: "Submit a café",
    intro:
      "Know a spot that belongs here? Submit it and our concierge will verify the café is real, check for duplicates, and draft its profile. Nothing goes live without verification — community picks get a badge so you know they weren't hand-curated.",
    nameLabel: "Café name",
    namePlaceholder: "e.g. Kaya",
    locationLabel: "Address or Google Maps link",
    locationPlaceholder: "e.g. Voulis 7, Athens or Leof. Kifisias 232, Kifisia",
    noteLabel: "Anything the concierge should know?",
    optional: "(optional)",
    notePlaceholder: "Great filter coffee, nice courtyard…",
    honeypot: "Leave this field empty",
    submit: "Submit for verification",
    submitting: "Verifying with the concierge…",
    submittingNote:
      "The concierge checks the web, looks for duplicates, and drafts a record. Usually 10–30 seconds — keep this tab open.",
    verifiedTitle: "Verified — welcome to the list!",
    verifiedBody:
      "The concierge confirmed the café is real and it has no duplicates in the dataset.",
    verifiedCta: "See it on the map of cafés →",
    flaggedTitle: "Sent for human review",
    rejectedTitle: "Not added this time",
    flaggedBody:
      "The concierge couldn't fully confirm this café (or it may duplicate one we already have). A curator will take a look.",
    rejectedBody:
      "The concierge could not confirm this café exists. If it's real, double-check the name and address and try again.",
    another: "Submit another café",
    unexpected: "unexpected response",
    networkError: "network error",
  },
  concierge: {
    title: "Café Concierge",
    headerNote: "only recommends cafés in our dataset",
    stripSummary: "Ask the concierge — it only recommends cafés in our dataset",
    placeholder: "Ask the concierge — e.g. “quiet place to work near Exarchia?”",
    empty:
      "Ask about the best espresso, a quiet corner to work from, or which café fits your budget.",
    thinking: "Thinking…",
    send: "Send",
    inputAria: "Message the concierge",
    disclaimer:
      "Answers are AI-generated (via OpenRouter) and can get details wrong — check the café before you go.",
    genericError: "something went wrong",
  },
  axes: {
    quality: "Quality",
    priceValue: "Value",
    workFriendliness: "Work",
    quietVibe: "Quiet",
    specialtyDepth: "Specialty",
  } satisfies Record<ScoreAxis, string>,
  moods: {
    laptopDay: "Laptop day",
    talk: "Talk",
    filterNerd: "Filter nerd",
    goodCheap: "Good & cheap",
  } satisfies Record<MoodId, string>,
  bestFor: {
    quality: "Top cup",
    value: "Good value",
    laptop: "Laptop-friendly",
    quiet: "Quiet",
    filter: "Filter program",
  } satisfies Record<BestForChip, string>,
  meta: {
    siteTitle: "Radaroma",
    siteDescription:
      "Attica cafés, as a shape. Five-axis radar profiles, a ranking you steer with weights, and a concierge that only knows the cafés we list.",
    ogDescription:
      "Attica cafés, as a shape. Radar charts, weighted re-ranking, and an AI concierge grounded in the dataset.",
    twitterDescription: "Attica cafés, as a shape.",
    cafes: {
      title: "Cafés",
      description: "All curated Attica cafés, ranked by what you care about.",
    },
    compare: {
      title: "Compare",
      description: "Overlay 2–3 cafés and compare their radar charts side by side.",
    },
    submit: {
      title: "Submit a café",
      description:
        "Know a great Attica café that's missing? Submit it — an AI concierge verifies it's real and checks for duplicates before it goes live.",
    },
  },
}

export type Strings = typeof en

const el: Strings = {
  htmlLang: "el",
  nav: {
    cafes: "Καφέ",
    compare: "Σύγκριση",
    submit: "Πρότεινε καφέ",
    submitShort: "Πρότεινε",
    ask: "Ρώτησε",
  },
  footer: {
    tagline:
      "Radaroma — μια επιμελημένη, σταθμισμένη σύγκριση καφέ της Αττικής. Οι βαθμοί είναι γνώμες· πήγαινε και δοκίμασε.",
    privacy:
      "Ο ιστότοπος δεν αποθηκεύει cookies — η σελίδα διαχείρισης συνδέεται μέσω Cloudflare Access. Τα ανώνυμα στατιστικά επισκέψεων προέρχονται από το Cloudflare Web Analytics, που δεν χρησιμοποιεί cookies.",
  },
  home: {
    headline: "Τα καφέ της Αττικής, σε σχήμα. Δες πού ξεχωρίζει το καθένα.",
    searchAll: (n: number) => `Αναζήτηση και φίλτρα σε όλα τα ${n} καφέ →`,
  },
  explorer: {
    heading: "Βρες με βάση αυτό που μετράει για σένα",
    reset: "Επαναφορά",
    moodsAria: "Προεπιλογές διάθεσης",
    sliderAria: (axis: string) => `Βαρύτητα: ${axis}`,
    neighborhood: "Γειτονιά",
    price: "Τιμή",
    search: "Αναζήτηση",
    anyPrice: "Κάθε τιμή",
    all: "Όλες",
    searchPlaceholder: "Όνομα καφέ…",
    count: (list: number, total: number) => `${list} από ${total} καφέ`,
    empty: "Κανένα καφέ δεν βγαίνει με αυτά τα φίλτρα — δοκίμασε πιο χαλαρά.",
  },
  card: {
    match: "σκορ",
    community: "πρόταση από την κοινότητα · έλεγχος με AI",
  },
  cafesPage: {
    title: "Καφέ",
    sub: (n: number) => `${n} επιβεβαιωμένα καφέ. Ρύθμισε τα βάρη για να βρεις το δικό σου μέρος.`,
  },
  detail: {
    allCafes: "← Όλα τα καφέ",
    bestFor: "Καλό για",
    compareWith: (name: string | null) => `Σύγκρινέ το${name ? ` με ${name}` : ""} →`,
    noScores: "Δεν υπάρχουν ακόμη βαθμοί — σύντομα.",
    scoreBreakdown: "Ανάλυση βαθμών",
    notScored: "Δεν έχει βαθμολογηθεί ακόμη.",
    askTitle: "Ρώτα για αυτό το καφέ",
    askSub: (name: string) => `Ερωτήσεις για ${name}; Ο βοηθός καφέ ξέρει το προφίλ του.`,
    askPlaceholder: (name: string) => `Ρώτησε για ${name}…`,
  },
  compare: {
    title: "Σύγκριση",
    sub: "Σύγκρινε έως τρία καφέ στο ίδιο ραντάρ.",
    pick: (n: number, max: number) => `Διάλεξε 2–3 καφέ (${n}/${max})`,
    hint: "Ο σύνδεσμος ενημερώνεται όσο διαλέγεις — μοιράσου τον για να δείξεις τη σύγκριση.",
    copied: "Αντιγράφηκε",
    copyLink: "Αντιγραφή συνδέσμου",
    axis: "Άξονας",
    average: "Μέσος όρος",
    selectTwo: "Διάλεξε τουλάχιστον δύο καφέ για να δεις τα ραντάρ τους μαζί.",
  },
  submit: {
    title: "Πρότεινε καφέ",
    intro:
      "Ξέρεις ένα μέρος που του αξίζει να είναι εδώ; Στείλ' το και ο βοηθός καφέ θα επιβεβαιώσει ότι το καφέ υπάρχει, θα ψάξει για διπλότυπα και θα συντάξει το προφίλ του. Τίποτα δεν δημοσιεύεται χωρίς επιβεβαίωση — οι προτάσεις της κοινότητας παίρνουν σήμανση, για να ξέρεις ότι δεν είναι δική μας επιλογή.",
    nameLabel: "Όνομα καφέ",
    namePlaceholder: "π.χ. Kaya",
    locationLabel: "Διεύθυνση ή σύνδεσμος Google Maps",
    locationPlaceholder: "π.χ. Βουλής 7, Αθήνα ή Λεωφ. Κηφισίας 232, Κηφισιά",
    noteLabel: "Κάτι που πρέπει να ξέρει ο βοηθός;",
    optional: "(προαιρετικό)",
    notePlaceholder: "Ωραίο φίλτρο, όμορφη αυλή…",
    honeypot: "Άφησε αυτό το πεδίο άδειο",
    submit: "Υποβολή για επιβεβαίωση",
    submitting: "Ο βοηθός επιβεβαιώνει…",
    submittingNote:
      "Ο βοηθός ψάχνει στο διαδίκτυο, κοιτάζει για διπλότυπα και συντάσσει εγγραφή. Συνήθως 10–30 δευτερόλεπτα — κράτησε την καρτέλα ανοιχτή.",
    verifiedTitle: "Επιβεβαιώθηκε — καλώς ήρθε στη λίστα!",
    verifiedBody:
      "Ο βοηθός επιβεβαίωσε ότι το καφέ υπάρχει και δεν έχει διπλότυπο στον κατάλογο.",
    verifiedCta: "Δες το στη λίστα των καφέ →",
    flaggedTitle: "Στάλθηκε για ανθρώπινο έλεγχο",
    rejectedTitle: "Δεν προστέθηκε αυτή τη φορά",
    flaggedBody:
      "Ο βοηθός δεν μπόρεσε να επιβεβαιώσει πλήρως αυτό το καφέ (ή ίσως διπλασιάζει κάποιο που έχουμε ήδη). Θα το δει ένας επιμελητής.",
    rejectedBody:
      "Ο βοηθός δεν μπόρεσε να επιβεβαιώσει ότι αυτό το καφέ υπάρχει. Αν υπάρχει, έλεγξε ξανά το όνομα και τη διεύθυνση και ξαναδοκίμασε.",
    another: "Πρότεινε άλλο καφέ",
    unexpected: "απρόσμενη απάντηση",
    networkError: "σφάλμα δικτύου",
  },
  concierge: {
    title: "Βοηθός καφέ",
    headerNote: "προτείνει μόνο καφέ από τον κατάλογό μας",
    stripSummary: "Ρώτα τον βοηθό — προτείνει μόνο καφέ από τον κατάλογό μας",
    placeholder: "Ρώτα τον βοηθό — π.χ. «ήσυχο μέρος για δουλειά κοντά στα Εξάρχεια;»",
    empty:
      "Ρώτησε για τον καλύτερο εσπρέσο, μια ήσυχη γωνιά για δουλειά, ή ποιο καφέ ταιριάζει στον προϋπολογισμό σου.",
    thinking: "Σκέφτεται…",
    send: "Αποστολή",
    inputAria: "Μήνυμα στον βοηθό καφέ",
    disclaimer:
      "Οι απαντήσεις παράγονται με AI (μέσω OpenRouter) και μπορεί να κάνουν λάθη — τσέκαρε το καφέ πριν πας.",
    genericError: "κάτι πήγε στραβά",
  },
  axes: {
    quality: "Ποιότητα",
    priceValue: "Αξία",
    workFriendliness: "Δουλειά",
    quietVibe: "Ησυχία",
    specialtyDepth: "Specialty",
  },
  moods: {
    laptopDay: "Για δουλειά με λάπτοπ",
    talk: "Για κουβέντα",
    filterNerd: "Nerd του φίλτρου",
    goodCheap: "Καλό και φθηνό",
  },
  bestFor: {
    quality: "Κορυφαίο φλιτζάνι",
    value: "Αξίζει τα λεφτά του",
    laptop: "Για λάπτοπ",
    quiet: "Ήσυχο",
    filter: "Πρόγραμμα φίλτρου",
  },
  meta: {
    siteTitle: "Radaroma",
    siteDescription:
      "Τα καφέ της Αττικής, σε σχήμα. Ραντάρ πέντε αξόνων, κατάταξη που ρυθμίζεις εσύ με βάρη, και ένας βοηθός με AI που ξέρει μόνο τα καφέ του καταλόγου.",
    ogDescription:
      "Τα καφέ της Αττικής, σε σχήμα. Ραντάρ, κατάταξη με τα δικά σου βάρη και βοηθός με AI πάνω στον κατάλογο.",
    twitterDescription: "Τα καφέ της Αττικής, σε σχήμα.",
    cafes: {
      title: "Καφέ",
      description: "Όλα τα επιλεγμένα καφέ της Αττικής, σε κατάταξη με βάση αυτό που μετράει για σένα.",
    },
    compare: {
      title: "Σύγκριση",
      description: "Σύγκρινε 2–3 καφέ στο ίδιο ραντάρ και δες πού ξεχωρίζει το καθένα.",
    },
    submit: {
      title: "Πρότεινε καφέ",
      description:
        "Λείπει ένα ωραίο καφέ της Αττικής; Πρότεινέ το — ένας βοηθός με AI επιβεβαιώνει ότι υπάρχει και ελέγχει για διπλότυπα πριν δημοσιευτεί.",
    },
  },
}

export const STRINGS: Record<Locale, Strings> = { en, el }

export function t(locale: Locale): Strings {
  return STRINGS[locale]
}
