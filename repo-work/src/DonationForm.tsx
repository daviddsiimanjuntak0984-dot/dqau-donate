import { useState, type FormEvent } from "react";
import { supabase } from "./supabase";

const PRESET_AMOUNTS = [5000, 10000, 20000, 50000, 100000];
type DonationFormProps = { creatorId: string; creatorName: string };
type CreateDonationResponse = { success?: boolean; checkout_url?: string; error?: string };

export function DonationForm({ creatorId, creatorName }: DonationFormProps) {
  const [amount, setAmount] = useState(20000);
  const [supporterName, setSupporterName] = useState("");
  const [supporterEmail, setSupporterEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; isError: boolean }>({ text: "", isError: false });

  const submitDonation = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!Number.isInteger(amount) || amount < 1000 || amount > 10000000) {
      setFeedback({ text: "Nominal donasi harus Rp1.000 sampai Rp10.000.000.", isError: true });
      return;
    }
    setSubmitting(true);
    setFeedback({ text: "Menyiapkan halaman pembayaran…", isError: false });
    try {
      const { data, error } = await supabase.functions.invoke("create-donation", {
        body: {
          creator_id: creatorId,
          amount_idr: amount,
          supporter_name: supporterName.trim() || "Anonim",
          supporter_email: supporterEmail.trim() || null,
          message: message.trim(),
          idempotency_key: crypto.randomUUID(),
        },
      });
      if (error) {
        setFeedback({
          text: "Pembayaran belum tersedia. Pastikan pengelola telah mengonfigurasi Midtrans dan Edge Functions.",
          isError: true,
        });
        return;
      }
      const result = data as CreateDonationResponse | null;
      if (!result?.success || typeof result.checkout_url !== "string") {
        setFeedback({ text: result?.error || "Halaman pembayaran belum dapat dibuat. Coba lagi nanti.", isError: true });
        return;
      }
      const checkout = new URL(result.checkout_url);
      if (checkout.protocol !== "https:" ||
          !["app.midtrans.com", "app.sandbox.midtrans.com"].includes(checkout.hostname)) {
        setFeedback({ text: "URL pembayaran tidak lolos pemeriksaan keamanan.", isError: true });
        return;
      }
      window.location.assign(checkout.toString());
    } catch {
      setFeedback({ text: "Koneksi pembayaran gagal. Periksa koneksi lalu coba lagi.", isError: true });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="donation-form" aria-labelledby={"donationFormTitle-" + creatorId}>
      <h4 id={"donationFormTitle-" + creatorId}>Dukung {creatorName}</h4>
      <p className="donation-form-note">
        Pembayaran menggunakan halaman checkout Midtrans. Fitur ini baru aktif setelah pengelola mengatur kredensial payment gateway.
      </p>
      <form onSubmit={submitDonation}>
        <span className="donation-form-label">Pilih nominal</span>
        <div className="donation-amount-grid">
          {PRESET_AMOUNTS.map((preset) => (
            <button
              key={preset}
              type="button"
              className={amount === preset ? "donation-amount is-selected" : "donation-amount"}
              aria-pressed={amount === preset}
              onClick={() => setAmount(preset)}
            >
              Rp {preset.toLocaleString("id-ID")}
            </button>
          ))}
        </div>
        <label htmlFor={"donorName-" + creatorId}>Nama pendukung (opsional)</label>
        <input
          id={"donorName-" + creatorId}
          value={supporterName}
          onChange={(event) => setSupporterName(event.target.value)}
          maxLength={40}
          autoComplete="name"
          placeholder="Anonim"
        />
        <label htmlFor={"donorEmail-" + creatorId}>Email (opsional)</label>
        <input
          id={"donorEmail-" + creatorId}
          type="email"
          value={supporterEmail}
          onChange={(event) => setSupporterEmail(event.target.value)}
          maxLength={254}
          autoComplete="email"
          placeholder="nama@email.com"
        />
        <label htmlFor={"donorMessage-" + creatorId}>Pesan untuk kreator (opsional)</label>
        <textarea
          id={"donorMessage-" + creatorId}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          maxLength={200}
          rows={3}
          placeholder="Tulis pesan yang sopan"
        />
        <p className="donation-form-feedback" role="status" aria-live="polite" data-error={feedback.isError}>
          {feedback.text}
        </p>
        <button className="btn btn-primary" type="submit" disabled={submitting}>
          {submitting ? "Menyiapkan…" : "Lanjut ke pembayaran"}
        </button>
      </form>
    </section>
  );
}
