import Image from "next/image";

export default function Home() {
  return (
    <div className="py-10 px-6 md:px-0 md:py-0 md:mt-20 md:max-w-4xl mx-auto">
      <div className="flex items-center  justify-center">
        <div className="w-full mx-auto text-center ">
          <div className="text-4xl font-bold tracking-tight">
            <span>Watch Market <span className="text-blue-400">charts</span> , summary and overview</span>
          </div>
          <button className="px-6 py-2 mt-2 rounded-md cursor-pointer bg-blue-300 ">See Charts</button>
        </div>
      </div>
    </div>
  );
}
