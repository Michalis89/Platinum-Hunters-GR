import Link from 'next/link';
import { buildMetadata } from '@/utils/seo/metadata/helpers';
import StructuredData from '@/utils/seo/StructuredData';
import { getBreadcrumbStructuredData } from '@/utils/seo/metadata/structuredData';
import { SITE_CONTACT_EMAIL, SITE_NAME, SITE_URL } from '@/config/site';

export const metadata = buildMetadata({
  title: 'Πολιτική Απορρήτου | Χομπίστας',
  description: 'Μάθε πώς ο Χομπίστας συλλέγει και προστατεύει τα δεδομένα σου.',
  path: '/pages/privacy',
});

export default function PrivacyPage() {
  const breadcrumb = [
    { name: 'Αρχική', url: `${SITE_URL}/` },
    { name: 'Πολιτική Απορρήτου', url: `${SITE_URL}/pages/privacy` },
  ];

  return (
    <>
      <StructuredData data={getBreadcrumbStructuredData(breadcrumb)} />
      <main className="min-h-screen bg-slate-950 bg-[radial-gradient(circle_at_top,_#1e293b,_#020617)] px-4 py-16 text-slate-100">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
          {/* Header / Hero */}
          <section className="rounded-3xl border border-slate-800/80 bg-slate-900/70 p-6 shadow-2xl backdrop-blur-xl md:p-8">
            <div className="mb-4">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                {SITE_NAME} • Προστασία Δεδομένων
              </p>
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-50 md:text-4xl">
                Πολιτική Απορρήτου
              </h1>
            </div>

            <p className="text-sm leading-relaxed text-slate-300 md:text-base">
              Η παρούσα Πολιτική Απορρήτου εξηγεί πώς ο{' '}
              <span className="font-semibold text-sky-400">{SITE_NAME}</span> συλλέγει, αποθηκεύει
              και επεξεργάζεται τα προσωπικά σου δεδομένα όταν χρησιμοποιείς την ιστοσελίδα{' '}
              <a
                href={SITE_URL}
                className="font-medium text-sky-400 underline-offset-2 hover:underline"
              >
                {SITE_URL.replace('https://', '')}
              </a>{' '}
              και τις συναφείς υπηρεσίες. Η επεξεργασία γίνεται σύμφωνα με τον Γενικό Κανονισμό
              Προστασίας Δεδομένων (GDPR) και την ελληνική νομοθεσία.
            </p>

            <p className="mt-3 text-xs text-slate-500">
              Τελευταία ενημέρωση: {new Date().getFullYear()}
            </p>
          </section>

          {/* Content */}
          <section className="rounded-3xl border border-slate-800/80 bg-slate-900/70 p-6 text-sm leading-relaxed text-slate-200 shadow-xl backdrop-blur-md md:p-8 md:text-base">
            <div className="space-y-6">
              {/* 1. Υπεύθυνος Επεξεργασίας */}
              <section>
                <h2 className="mb-2 text-lg font-semibold text-slate-50">
                  1. Υπεύθυνος Επεξεργασίας
                </h2>
                <p>
                  Υπεύθυνος επεξεργασίας των δεδομένων που συλλέγονται μέσω της Υπηρεσίας είναι ο
                  δημιουργός του <span className="font-semibold text-sky-400">{SITE_NAME}</span>.
                  Για θέματα που αφορούν την προστασία προσωπικών δεδομένων, μπορείς να
                  επικοινωνήσεις στο:
                </p>
                <p className="mt-1 font-medium text-sky-400">{SITE_CONTACT_EMAIL}</p>
              </section>

              {/* 2. Ποια δεδομένα συλλέγουμε */}
              <section>
                <h2 className="mb-2 text-lg font-semibold text-slate-50">
                  2. Ποια δεδομένα συλλέγουμε
                </h2>
                <p>
                  Ανάλογα με τη χρήση της Υπηρεσίας, μπορεί να συλλέγουμε τις εξής κατηγορίες
                  δεδομένων:
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>
                    <span className="font-semibold">Στοιχεία λογαριασμού:</span> email, username,
                    κρυπτογραφημένος κωδικός πρόσβασης, ημερομηνία δημιουργίας λογαριασμού.
                  </li>
                  <li>
                    <span className="font-semibold">Πληροφορίες προφίλ (προαιρετικές):</span>{' '}
                    display name, ονοματεπώνυμο, χώρα, bio, IDs (PSN, Xbox, Steam), αγαπημένα
                    genres, αγαπημένη πλατφόρμα, έτος έναρξης gaming.
                  </li>
                  <li>
                    <span className="font-semibold">Δεδομένα χρήσης:</span> ρυθμίσεις προφίλ, backlog
                    entries, status παιχνιδιών, ώρες που καταχωρείς εσύ, guides που δημιουργείς ή
                    επεξεργάζεσαι.
                  </li>
                  <li>
                    <span className="font-semibold">Τεχνικές πληροφορίες:</span> IP address,
                    browser, περίπου τύπο συσκευής, basic logs για λόγους ασφαλείας και debugging.
                  </li>
                  <li>
                    <span className="font-semibold">Cookies &amp; παρόμοιες τεχνολογίες:</span>{' '}
                    authentication cookies / session tokens μέσω Supabase και τυχόν απαραίτητα
                    cookies για τη λειτουργία της πλατφόρμας.
                  </li>
                </ul>
                <p className="mt-2 text-xs text-slate-400">
                  Δεν συλλέγουμε εσκεμμένα ευαίσθητα προσωπικά δεδομένα (π.χ. υγεία, πολιτικές απόψεις
                  κ.λπ.).
                </p>
              </section>

              {/* 3. Σκοποί επεξεργασίας */}
              <section>
                <h2 className="mb-2 text-lg font-semibold text-slate-50">
                  3. Σκοποί επεξεργασίας &amp; νομική βάση
                </h2>
                <p>Χρησιμοποιούμε τα δεδομένα σου για τους ακόλουθους σκοπούς:</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>
                    <span className="font-semibold">Δημιουργία και διαχείριση λογαριασμού:</span> για
                    να μπορείς να συνδεθείς, να αποθηκεύεις backlog, guides, προφίλ κ.λπ. (νομική
                    βάση: εκτέλεση σύμβασης).
                  </li>
                  <li>
                    <span className="font-semibold">Ασφάλεια &amp; προστασία:</span> για πρόληψη
                    κατάχρησης, κακόβουλης δραστηριότητας, μη εξουσιοδοτημένης πρόσβασης (νομική βάση:
                    έννομο συμφέρον).
                  </li>
                  <li>
                    <span className="font-semibold">Επικοινωνία μαζί σου:</span> για επιβεβαίωση
                    email, reset password, ειδοποιήσεις σχετικές με τον λογαριασμό σου (νομική βάση:
                    εκτέλεση σύμβασης / συμμόρφωση με αιτήματα χρήστη).
                  </li>
                  <li>
                    <span className="font-semibold">Βελτίωση της Υπηρεσίας:</span> βασική ανάλυση
                    χρήσης, στατιστικά και feedback (νομική βάση: έννομο συμφέρον). Δεν κάνουμε
                    profiling ή διαφημιστική στόχευση.
                  </li>
                </ul>
              </section>

              {/* 4. Πού αποθηκεύονται τα δεδομένα */}
              <section>
                <h2 className="mb-2 text-lg font-semibold text-slate-50">
                  4. Πού αποθηκεύονται τα δεδομένα σου
                </h2>
                <p>
                  Τα δεδομένα σου αποθηκεύονται κυρίως σε υποδομές της{' '}
                  <span className="font-semibold">Supabase</span> (database, authentication), καθώς
                  και σε hosting / υποδομές που χρησιμοποιούνται για τη λειτουργία του{' '}
                  <span className="font-semibold text-sky-400">{SITE_NAME}</span>.
                </p>
                <p className="mt-2">
                  Οι πάροχοι αυτοί λειτουργούν ως εκτελούντες την επεξεργασία για λογαριασμό μας,
                  βάσει συμβατικών όρων και πολιτικών ασφαλείας. Καταβάλλεται προσπάθεια ώστε τα
                  δεδομένα να φιλοξενούνται εντός της Ε.Ε. όπου αυτό είναι εφικτό.
                </p>
              </section>

              {/* 5. Χρόνος διατήρησης */}
              <section>
                <h2 className="mb-2 text-lg font-semibold text-slate-50">
                  5. Χρόνος διατήρησης δεδομένων
                </h2>
                <p>Τα δεδομένα σου διατηρούνται για όσο χρόνο:</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>διατηρείς ενεργό λογαριασμό στην Υπηρεσία,</li>
                  <li>είναι απαραίτητα για τη λειτουργία των δυνατοτήτων που χρησιμοποιείς,</li>
                  <li>ή απαιτείται από την ισχύουσα νομοθεσία.</li>
                </ul>
                <p className="mt-2">
                  Όταν διαγράψεις τον λογαριασμό σου, καταβάλλεται προσπάθεια να διαγράφονται ή να
                  ανωνυμοποιούνται τα προσωπικά δεδομένα που σε ταυτοποιούν, εκτός αν νομικές ή
                  τεχνικές υποχρεώσεις επιβάλλουν μεγαλύτερο χρόνο διατήρησης (π.χ. logs ασφαλείας).
                </p>
              </section>

              {/* 6. Cookies */}
              <section>
                <h2 className="mb-2 text-lg font-semibold text-slate-50">
                  6. Cookies &amp; παρόμοιες τεχνολογίες
                </h2>
                <p>Η Υπηρεσία χρησιμοποιεί cookies κυρίως για:</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>authentication (σύνδεση / παραμονή συνδεδεμένος),</li>
                  <li>βασική τεχνική λειτουργία (π.χ. preferences, session),</li>
                  <li>ενδεχομένως βασική στατιστική ανάλυση επισκεψιμότητας (αν ενεργοποιηθεί).</li>
                </ul>
                <p className="mt-2">
                  Μπορείς να ρυθμίσεις τον browser σου ώστε να μπλοκάρει ή να διαγράφει cookies, όμως
                  κάτι τέτοιο μπορεί να επηρεάσει τη λειτουργία της Υπηρεσίας (π.χ. αποσύνδεση).
                </p>
              </section>

              {/* 7. Κοινοποίηση δεδομένων */}
              <section>
                <h2 className="mb-2 text-lg font-semibold text-slate-50">
                  7. Κοινοποίηση δεδομένων σε τρίτους
                </h2>
                <p>
                  Δεν πωλούμε, δεν ενοικιάζουμε και δεν εμπορευόμαστε τα προσωπικά σου δεδομένα.
                  Δεδομένα μπορεί να κοινοποιηθούν:
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>
                    σε παρόχους υποδομών (όπως Supabase) που λειτουργούν ως εκτελούντες την
                    επεξεργασία,
                  </li>
                  <li>
                    σε αρμόδιες αρχές, όταν αυτό απαιτείται από το νόμο ή σε περίπτωση νομικής
                    διαδικασίας,
                  </li>
                  <li>
                    αν κριθεί απαραίτητο για την προστασία δικαιωμάτων, της ασφάλειας της Υπηρεσίας ή
                    άλλων χρηστών.
                  </li>
                </ul>
              </section>

              {/* 8. Τα δικαιώματά σου (GDPR) */}
              <section>
                <h2 className="mb-2 text-lg font-semibold text-slate-50">
                  8. Τα δικαιώματά σου σύμφωνα με τον GDPR
                </h2>
                <p>Έχεις, μεταξύ άλλων, τα εξής δικαιώματα σχετικά με τα προσωπικά σου δεδομένα:</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>δικαίωμα πρόσβασης στα δεδομένα σου,</li>
                  <li>δικαίωμα διόρθωσης ανακριβών ή ελλιπών δεδομένων,</li>
                  <li>δικαίωμα διαγραφής («δικαίωμα στη λήθη») υπό προϋποθέσεις,</li>
                  <li>δικαίωμα περιορισμού της επεξεργασίας,</li>
                  <li>δικαίωμα φορητότητας δεδομένων,</li>
                  <li>δικαίωμα εναντίωσης σε συγκεκριμένες μορφές επεξεργασίας.</li>
                </ul>
                <p className="mt-2">
                  Για να ασκήσεις τα δικαιώματά σου, μπορείς να επικοινωνήσεις στο{' '}
                  <span className="font-medium text-sky-400">{SITE_CONTACT_EMAIL}</span>. Θα
                  προσπαθήσουμε να απαντήσουμε μέσα σε εύλογο χρονικό διάστημα και σύμφωνα με το
                  ισχύον νομικό πλαίσιο.
                </p>
                <p className="mt-2 text-xs text-slate-400">
                  Έχεις επίσης το δικαίωμα να υποβάλεις καταγγελία στην αρμόδια εποπτική αρχή (Αρχή
                  Προστασίας Δεδομένων Προσωπικού Χαρακτήρα – www.dpa.gr), αν θεωρείς ότι η
                  επεξεργασία των δεδομένων σου παραβιάζει τη νομοθεσία.
                </p>
              </section>

              {/* 9. Ασφάλεια */}
              <section>
                <h2 className="mb-2 text-lg font-semibold text-slate-50">9. Ασφάλεια πληροφοριών</h2>
                <p>
                  Λαμβάνονται εύλογα τεχνικά και οργανωτικά μέτρα για την προστασία των δεδομένων σου
                  από μη εξουσιοδοτημένη πρόσβαση, απώλεια ή αλλοίωση. Ωστόσο, καμία διαδικτυακή
                  υπηρεσία δεν μπορεί να εγγυηθεί απόλυτη ασφάλεια.
                </p>
              </section>
              {/* 9.1 Ασφάλεια Κωδικών Πρόσβασης */}
              <section>
                <h2 className="mb-2 text-lg font-semibold text-slate-50">
                  9.1 Ασφάλεια Κωδικών Πρόσβασης
                </h2>
                <p>
                  Οι κωδικοί πρόσβασης των χρηστών δεν αποθηκεύονται ποτέ σε μορφή αναγνώσιμη από
                  άνθρωπο. Η διαδικασία αυθεντικοποίησης γίνεται μέσω της υπηρεσίας Supabase, η οποία
                  χρησιμοποιεί σύγχρονες τεχνικές κρυπτογράφησης (hashed &amp; salted), σύμφωνα με τα
                  σύγχρονα πρότυπα ασφαλείας.
                </p>
                <p className="mt-2">
                  Ως αποτέλεσμα, ούτε το{' '}
                  <span className="font-semibold text-sky-400">{SITE_NAME}</span>, ούτε οι
                  διαχειριστές του έχουν πρόσβαση στους πραγματικούς κωδικούς πρόσβασης. Σε περίπτωση
                  απώλειας κωδικού, η επαναφορά πραγματοποιείται αποκλειστικά μέσω ασφαλών email
                  verification links.
                </p>
              </section>

              {/* 10. Αλλαγές στην Πολιτική */}
              <section>
                <h2 className="mb-2 text-lg font-semibold text-slate-50">
                  10. Αλλαγές στην Πολιτική Απορρήτου
                </h2>
                <p>
                  Η παρούσα Πολιτική μπορεί να ενημερώνεται ανά διαστήματα, ώστε να αντικατοπτρίζει
                  αλλαγές στην Υπηρεσία, στους παρόχους ή στο νομικό πλαίσιο. Η ενημερωμένη εκδοχή θα
                  δημοσιεύεται στην ιστοσελίδα και, όπου κριθεί σκόπιμο, μπορεί να λάβεις σχετική
                  ειδοποίηση.
                </p>
              </section>

              {/* 11. Σύνδεση με Όρους Χρήσης */}
              <section>
                <h2 className="mb-2 text-lg font-semibold text-slate-50">
                  11. Σχέση με τους Όρους Χρήσης
                </h2>
                <p>
                  Οι παρόντες όροι για την προστασία δεδομένων συμπληρώνουν τους{' '}
                  <Link
                    href="/pages/terms"
                    className="font-medium text-sky-400 underline-offset-2 hover:underline"
                  >
                    Όρους Χρήσης
                  </Link>
                  . Σε περίπτωση ασυμφωνίας, υπερισχύουν οι διατάξεις που προστατεύουν περισσότερο τα
                  δικαιώματά σου ως υποκείμενο δεδομένων.
                </p>
              </section>

              <p className="pt-4 text-xs text-slate-500">
                Το παρόν κείμενο παρέχεται σε απλή, κατανοητή μορφή και μπορεί να προσαρμοστεί
                περαιτέρω με εξειδικευμένη νομική συμβουλή, ανάλογα με την εξέλιξη της Υπηρεσίας.
              </p>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
