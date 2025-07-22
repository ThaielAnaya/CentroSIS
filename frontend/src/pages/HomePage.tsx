import logo from "@/assets/tenriicon.webp";

export default function HomePage() {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-4">
      <img src={logo} alt="logo" className="h-20 w-20 object-contain" />
      <h1 className="text-2xl font-semibold">Bienvenido al sistema de gestión</h1>
    </div>
  );
}