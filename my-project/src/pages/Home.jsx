import React from "react";

const Home = () => {
  return (
    <div className="h-screen flex flex-col justify-center items-center bg-white font-sans">
      
      {/* Title */}
      <h1 className="text-3xl md:text-4xl font-medium mb-8 text-black">
        What can I help with?
      </h1>

      {/* Input Box */}
      <div className="flex items-center w-[420px] max-w-[90%] border border-gray-300 rounded-full px-4 py-3 shadow-md">
        
        {/* Plus icon */}
        <span className="text-xl text-gray-600 cursor-pointer mr-3">
          +
        </span>

        {/* Input */}
        <input
          type="text"
          placeholder="Ask anything"
          className="flex-1 outline-none border-none text-base placeholder-gray-500"
        />

        {/* Mic button */}
        <button className="ml-3 w-9 h-9 rounded-full bg-black text-white flex items-center justify-center hover:bg-gray-800 transition">
          🎤
        </button>

      </div>
    </div>
  );
};

export default Home;
