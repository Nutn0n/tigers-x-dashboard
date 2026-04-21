import { DashboardTopBar } from "@/components/DashboardTopBar";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#000] text-[#eee]">
      <div className="mx-auto w-full max-w-[2000px] px-3 md:px-4">
        <DashboardTopBar />
      </div>
    </div>
  );
}
