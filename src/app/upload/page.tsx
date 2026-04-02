import CSVUpload from '@/components/CSVUpload'
export default function UploadPage() {
  return (
    <main className="min-h-screen p-8">
      <h1 className="text-3xl font-bold">Upload Portfolio</h1>
      <p className="text-gray-500 mt-2">Upload your Trading 212 CSV export</p>
      <CSVUpload />
    </main>
  )
}