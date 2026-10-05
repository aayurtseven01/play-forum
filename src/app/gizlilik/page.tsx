export const metadata = { title: 'Gizlilik Politikası' };

export default function PrivacyPage() {
  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, margin: '26px 0 14px' }}>Gizlilik Politikası</h1>
      <div className="card card-pad prose">
        <p>
          Play Forum; kullanıcı adı, görünen ad, e-posta ve paylaştığın içerikleri hesabını
          çalıştırmak için saklar. Bu veriler Supabase altyapısında, yalnızca forumun
          çalışması amacıyla tutulur.
        </p>
        <p>
          <b>Avatar yüklemeleri</b> depolama alanında saklanır ve profilinde herkese açık
          gösterilir. <b>Özel mesajların</b> yalnızca katılımcıları tarafından görülebilir.
        </p>
        <p>
          Görüntülenme ve son görülme gibi istatistikler topluluk istatistikleri için
          kullanılır; üçüncü kişilerle paylaşılmaz, reklam amaçlı izleme yapılmaz.
        </p>
        <p>
          Hesabını ve içeriklerini sildirmek istersen yöneticilere başvurabilirsin.
        </p>
      </div>
    </div>
  );
}
