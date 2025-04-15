import React from 'react';

function ItemCard({ item, onSelect, selected }) {
  return (
    <div
    onClick={onSelect}
    className={`cursor-pointer relative w-full rounded-lg shadow-md overflow-hidden flex flex-col items-center justify-between transition-all duration-200 ${
      selected ? 'ring-4 ring-white scale-105' : ''
    }`}
    style={{ backgroundColor: item.rarityColor, height: "230px" }}
    >
      <img
        src={item.image}
        alt={item.name}
        className="w-[150px] h-[150px] object-cover mt-2 rounded"
      />
      <div className="bg-[#212225] text-center w-full py-2 px-3 text-xs">
        <h3 className="font-bold uppercase truncate">{item.name}</h3>
        <div className="mt-1 font-semibold text-base">
          {item.vBucks}
        </div>
        <p className="mt-1">⏱️ {item.timeLeft}</p>
      </div>
    </div>
  );
}

export default ItemCard;
