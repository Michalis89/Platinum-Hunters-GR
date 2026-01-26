import Link from 'next/link';
import { buildMetadata } from '@/utils/seo/metadata/helpers';
import StructuredData from '@/utils/seo/StructuredData';
import { getBreadcrumbStructuredData } from '@/utils/seo/metadata/structuredData';
import { SITE_CONTACT_EMAIL, SITE_NAME, SITE_URL } from '@/config/site';
import { PageContainer, PageHeader } from '@/app/components/layout';

export const metadata = buildMetadata({
  title: 'Όροι Χρήσης | Χομπίστας',
  description: 'Διάβασε τους όρους χρήσης της υπηρεσίας Χομπίστας.',
  path: '/pages/terms',
});

export default function TermsPage() {
  const breadcrumb = [
    { name: 'Αρχική', url: `${SITE_URL}/` },
    { name: 'Όροι Χρήσης', url: `${SITE_URL}/pages/terms` },
  ];

  return (
    <>
      <StructuredData data={getBreadcrumbStructuredData(breadcrumb)} />
      <PageContainer size="sm" className="py-12">
        <div className="flex flex-col gap-6">
          {/* Header / Hero */}
          <section className="rounded-3xl border border-[var(--hb-border)] bg-[var(--hb-panel)] p-6 shadow-2xl backdrop-blur-xl md:p-8">
            <PageHeader
              eyebrow={`${SITE_NAME} • Νομικές Πληροφορίες`}
              title="Όροι Χρήσης"
              description={
                <>
                  Οι παρακάτω Όροι Χρήσης διέπουν την πρόσβαση και χρήση της υπηρεσίας{' '}
                  <span className="font-semibold text-[var(--hb-primary-strong)]">{SITE_NAME}</span>{' '}
                  (η «Υπηρεσία») μέσω της ιστοσελίδας{' '}
                  <a
                    href={SITE_URL}
                    className="font-medium text-[var(--hb-primary-strong)] underline-offset-2 hover:underline"
                  >
                    {SITE_URL.replace('https://', '')}
                  </a>
                  . Με τη δημιουργία λογαριασμού ή/και τη χρήση της Υπηρεσίας, δηλώνεις ότι έχεις
                  διαβάσει, κατανοήσει και αποδέχεσαι τους παρόντες Όρους.
                </>
              }
              meta={`Τελευταία ενημέρωση: ${new Date().getFullYear()}`}
              align="left"
              contentClassName="items-start"
              titleClassName="mt-2 text-3xl font-extrabold tracking-tight md:text-4xl"
              eyebrowClassName="tracking-[0.25em] text-[var(--hb-muted)]"
              descriptionClassName="text-sm leading-relaxed text-[var(--hb-text)] md:text-base"
              metaClassName="text-xs text-[var(--hb-muted)] opacity-70"
            />
          </section>

          {/* Content Card */}
          <section className="rounded-3xl border border-[var(--hb-border)] bg-[var(--hb-panel)] p-6 text-sm leading-relaxed text-[var(--hb-text)] shadow-xl backdrop-blur-md md:p-8 md:text-base">
            <div className="space-y-6">
              {/* 1. Ταυτότητα Υπηρεσίας */}
              <section>
                <h2 className="mb-2 text-lg font-semibold text-[var(--hb-headline)]">
                  1. Ταυτότητα της Υπηρεσίας
                </h2>
                <p>
                  Ο{' '}
                  <span className="font-semibold text-[var(--hb-primary-strong)]">{SITE_NAME}</span>{' '}
                  είναι μία διαδικτυακή πλατφόρμα για καταγραφή backlog, guides, reviews και
                  σχετικού περιεχομένου γύρω από hobbies. Η Υπηρεσία παρέχεται σε ερασιτεχνική /
                  προσωπική βάση και δεν αποτελεί επίσημο προϊόν οποιασδήποτε εταιρείας.
                </p>
                <p className="mt-2 text-xs text-[var(--hb-muted)]">
                  Η χρήση οποιωνδήποτε ονομάτων, λογοτύπων, σημάτων ή όρων όπως
                  &quot;PlayStation&quot;, &quot;PS5&quot;, &quot;Trophies&quot; κ.λπ. γίνεται
                  αποκλειστικά περιγραφικά και ανήκουν στους νόμιμους κατόχους τους.
                </p>
              </section>

              {/* 2. Αποδοχή Όρων */}
              <section>
                <h2 className="mb-2 text-lg font-semibold text-[var(--hb-headline)]">
                  2. Αποδοχή των Όρων Χρήσης
                </h2>
                <p>
                  Με την πρόσβαση ή/και χρήση της Υπηρεσίας, συμφωνείς ότι δεσμεύεσαι από τους
                  παρόντες Όρους Χρήσης. Αν δεν συμφωνείς με κάποιο σημείο, παρακαλούμε να διακόψεις
                  άμεσα τη χρήση της Υπηρεσίας και να προχωρήσεις σε διαγραφή του λογαριασμού σου.
                </p>
                <p className="mt-2">
                  Η Υπηρεσία απευθύνεται σε χρήστες ηλικίας άνω των 16 ετών. Χρησιμοποιώντας την
                  Υπηρεσία, δηλώνεις υπεύθυνα ότι είσαι τουλάχιστον 16 ετών.
                </p>
              </section>

              {/* 3. Λογαριασμός Χρήστη */}
              <section>
                <h2 className="mb-2 text-lg font-semibold text-[var(--hb-headline)]">
                  3. Λογαριασμός Χρήστη &amp; Ασφάλεια
                </h2>
                <p>
                  Για να χρησιμοποιήσεις πλήρως την Υπηρεσία, μπορεί να χρειαστεί να δημιουργήσεις
                  λογαριασμό με email και κωδικό πρόσβασης ή/και άλλους τρόπους ταυτοποίησης. Είσαι
                  αποκλειστικά υπεύθυνος για:
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>τη διατήρηση της εμπιστευτικότητας των στοιχείων σύνδεσής σου,</li>
                  <li>κάθε ενέργεια που πραγματοποιείται μέσω του λογαριασμού σου,</li>
                  <li>
                    την παροχή ακριβών και ενημερωμένων πληροφοριών προφίλ (όπου επιλέγεις να τις
                    δώσεις).
                  </li>
                </ul>
                <p className="mt-2">
                  Σε περίπτωση που υποψιαστείς μη εξουσιοδοτημένη χρήση του λογαριασμού σου,
                  οφείλεις να αλλάξεις κωδικό και, εφόσον χρειάζεται, να επικοινωνήσεις μαζί μας.
                </p>
              </section>

              {/* 4. Περιεχόμενο Χρήστη */}
              <section>
                <h2 className="mb-2 text-lg font-semibold text-[var(--hb-headline)]">
                  4. Περιεχόμενο Χρήστη (User Generated Content)
                </h2>
                <p>
                  Η Υπηρεσία μπορεί να σου επιτρέψει να δημιουργείς ή να καταχωρείς περιεχόμενο,
                  όπως guides, κείμενα, σχόλια, βαθμολογίες κ.λπ. («Περιεχόμενο Χρήστη»).
                  Παραμένοντας δημιουργός του περιεχομένου, διατηρείς τα δικαιώματα πνευματικής
                  ιδιοκτησίας σου, αλλά με τη δημοσίευση:
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>
                    μας χορηγείς μη αποκλειστική, παγκόσμια, ατελή άδεια χρήσης, προβολής και
                    αποθήκευσης του Περιεχομένου Χρήστη σε σχέση με τη λειτουργία της Υπηρεσίας,
                  </li>
                  <li>
                    δηλώνεις ότι το περιεχόμενο δεν παραβιάζει δικαιώματα τρίτων (πνευματικά,
                    προσωπικά δεδομένα, εμπορικά σήματα κ.λπ.).
                  </li>
                </ul>
                <p className="mt-2">
                  Διατηρούμε το δικαίωμα (χωρίς όμως υποχρέωση) να αφαιρέσουμε περιεχόμενο που
                  θεωρούμε ότι παραβιάζει τους Όρους, τη νομοθεσία ή είναι ακατάλληλο.
                </p>
              </section>

              {/* 5. Επιτρεπτή Χρήση */}
              <section>
                <h2 className="mb-2 text-lg font-semibold text-[var(--hb-headline)]">
                  5. Επιτρεπτή Χρήση της Υπηρεσίας
                </h2>
                <p>Απαγορεύεται να χρησιμοποιείς την Υπηρεσία για:</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>παράνομες δραστηριότητες ή παραβίαση δικαιωμάτων τρίτων,</li>
                  <li>
                    δημοσίευση προσβλητικού, ρατσιστικού, υβριστικού, πορνογραφικού ή βίαιου
                    περιεχομένου,
                  </li>
                  <li>spam, αυτοματοποιημένα scripts, scraping ή επιθέσεις στο σύστημα,</li>
                  <li>προσπάθεια μη εξουσιοδοτημένης πρόσβασης σε δεδομένα ή λογαριασμούς,</li>
                  <li>
                    χρήση της Υπηρεσίας με τρόπο που μπορεί να βλάψει, υπερφορτώσει ή
                    αποσταθεροποιήσει την πλατφόρμα.
                  </li>
                </ul>
                <p className="mt-2">
                  Σε περίπτωση παραβίασης, μπορούμε να αναστείλουμε ή να διαγράψουμε τον λογαριασμό
                  σου, καθώς και να αφαιρέσουμε σχετικό περιεχόμενο χωρίς προειδοποίηση.
                </p>
              </section>

              {/* 6. Πνευματική Ιδιοκτησία */}
              <section>
                <h2 className="mb-2 text-lg font-semibold text-[var(--hb-headline)]">
                  6. Πνευματική Ιδιοκτησία &amp; Σήματα
                </h2>
                <p>
                  Όλο το περιεχόμενο της Υπηρεσίας (interface, design, λογότυπα της πλατφόρμας,
                  κείμενα, στοιχεία UI κ.λπ.), εξαιρουμένου του Περιεχομένου Χρήστη και σημάτων
                  τρίτων, ανήκει στον δημιουργό του{' '}
                  <span className="font-semibold">{SITE_NAME}</span> και προστατεύεται από τη
                  σχετική νομοθεσία.
                </p>
                <p className="mt-2">
                  Τα σήματα τρίτων, τα λογότυπα και τα ονόματα προϊόντων ανήκουν στους αντίστοιχους
                  νόμιμους κατόχους τους και χρησιμοποιούνται μόνο περιγραφικά. Η Υπηρεσία δεν
                  συνδέεται, δεν υποστηρίζεται και δεν ανήκει σε καμία εταιρεία.
                </p>
              </section>

              {/* 7. Διαθεσιμότητα & Τροποποιήσεις */}
              <section>
                <h2 className="mb-2 text-lg font-semibold text-[var(--hb-headline)]">
                  7. Διαθεσιμότητα &amp; Τροποποιήσεις της Υπηρεσίας
                </h2>
                <p>
                  Η Υπηρεσία παρέχεται «ως έχει» και «όπως είναι διαθέσιμη», χωρίς εγγυήσεις
                  συνεχούς λειτουργίας, απουσίας σφαλμάτων ή πλήρους ακρίβειας των πληροφοριών.
                  Μπορεί να διακόψουμε, να τροποποιήσουμε ή να αφαιρέσουμε λειτουργίες οποτεδήποτε,
                  χωρίς προειδοποίηση.
                </p>
                <p className="mt-2">
                  Διατηρούμε επίσης το δικαίωμα να ενημερώνουμε τους παρόντες Όρους Χρήσης. Όταν
                  γίνονται ουσιώδεις αλλαγές, μπορεί να ενημερώνεσαι μέσω της Υπηρεσίας ή/και email.
                  Η συνέχιση της χρήσης μετά από αλλαγές σημαίνει αποδοχή των νέων Όρων.
                </p>
              </section>

              {/* 8. Ευθύνη */}
              <section>
                <h2 className="mb-2 text-lg font-semibold text-[var(--hb-headline)]">
                  8. Περιορισμός Ευθύνης
                </h2>
                <p>
                  Στο μέγιστο βαθμό που επιτρέπεται από την ισχύουσα νομοθεσία, δεν φέρουμε ευθύνη
                  για άμεσες ή έμμεσες ζημίες, απώλεια δεδομένων, κερδών ή οποιασδήποτε άλλης μορφής
                  ζημία που μπορεί να προκύψει από:
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>τη χρήση ή αδυναμία χρήσης της Υπηρεσίας,</li>
                  <li>τυχόν σφάλματα, παραλείψεις ή ανακρίβειες σε περιεχόμενο,</li>
                  <li>
                    μη εξουσιοδοτημένη πρόσβαση ή χρήση λογαριασμών, servers ή βάσεων δεδομένων,
                  </li>
                  <li>περιστασιακή διακοπή, καθυστέρηση ή δυσλειτουργία της Υπηρεσίας.</li>
                </ul>
              </section>

              {/* 9. Προσωπικά Δεδομένα */}
              <section>
                <h2 className="mb-2 text-lg font-semibold text-[var(--hb-headline)]">
                  9. Προστασία Προσωπικών Δεδομένων
                </h2>
                <p>
                  Η επεξεργασία των προσωπικών δεδομένων σου διέπεται από την{' '}
                  <Link
                    href="/pages/privacy"
                    className="font-medium text-[var(--hb-primary-strong)] underline-offset-2 hover:underline"
                  >
                    Πολιτική Απορρήτου
                  </Link>
                  , η οποία αποτελεί αναπόσπαστο μέρος των παρόντων Όρων. Παρακαλούμε να τη
                  διαβάσεις προσεκτικά, καθώς περιγράφει αναλυτικά ποια δεδομένα συλλέγουμε, για
                  ποιο σκοπό και ποια δικαιώματα έχεις υπό το ισχύον νομικό πλαίσιο (GDPR).
                </p>
              </section>

              {/* 10. Διαγραφή Λογαριασμού */}
              <section>
                <h2 className="mb-2 text-lg font-semibold text-[var(--hb-headline)]">
                  10. Τερματισμός &amp; Διαγραφή Λογαριασμού
                </h2>
                <p>
                  Μπορείς ανά πάσα στιγμή να διαγράψεις τον λογαριασμό σου μέσω των ρυθμίσεων
                  προφίλ, εφόσον η λειτουργία αυτή είναι διαθέσιμη, ή επικοινωνώντας μαζί μας. Με τη
                  διαγραφή, ενδέχεται να διαγραφούν ή να ανωνυμοποιηθούν δεδομένα που σε
                  ταυτοποιούν, σύμφωνα με την Πολιτική Απορρήτου.
                </p>
                <p className="mt-2">
                  Διατηρούμε το δικαίωμα να αναστείλουμε ή να κλείσουμε λογαριασμούς που παραβιάζουν
                  τους Όρους, το νόμο ή κάνουν κακή χρήση της Υπηρεσίας.
                </p>
              </section>

              {/* 11. Εφαρμοστέο Δίκαιο */}
              <section>
                <h2 className="mb-2 text-lg font-semibold text-[var(--hb-headline)]">
                  11. Εφαρμοστέο Δίκαιο &amp; Επίλυση Διαφορών
                </h2>
                <p>
                  Οι παρόντες Όροι διέπονται από το Ελληνικό δίκαιο. Για κάθε διαφορά που τυχόν
                  προκύψει και δεν μπορεί να επιλυθεί φιλικά, αρμόδια θα είναι τα δικαστήρια της
                  Ελλάδας.
                </p>
              </section>

              {/* 12. Επικοινωνία */}
              <section>
                <h2 className="mb-2 text-lg font-semibold text-[var(--hb-headline)]">
                  12. Επικοινωνία
                </h2>
                <p>
                  Για οποιαδήποτε απορία σχετικά με τους παρόντες Όρους Χρήσης ή την Υπηρεσία,
                  μπορείς να επικοινωνήσεις μαζί μας στο:
                </p>
                <p className="mt-1 font-medium text-[var(--hb-primary-strong)]">
                  {SITE_CONTACT_EMAIL}
                </p>
              </section>

              <p className="pt-4 text-xs text-[var(--hb-muted)] opacity-70">
                Οι παραπάνω όροι παρέχονται για ενημερωτικούς σκοπούς και μπορεί να προσαρμοστούν ή
                να εμπλουτιστούν περαιτέρω με νομική συμβουλή, ανάλογα με την εξέλιξη της Υπηρεσίας.
              </p>
            </div>
          </section>
        </div>
      </PageContainer>
    </>
  );
}
