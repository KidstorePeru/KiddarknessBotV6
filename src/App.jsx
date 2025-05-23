import React, { useEffect, useState } from 'react';
import ItemCard from './components/ItemCard';

const getRarityColor = (rarity) => {
  const colors = {
    "Común": "#B8B8B8",
    "Poco Común": "#00A859",
    "Raro": "#0086FF",
    "Épico": "#911EFF",
    "Legendario": "#FF8000",
    "Serie de ídolos": "#5cf2f3",
    "Serie de PUMA": "#813a95",
    "Serie de Marvel": "#ed1d24",
    "Serie de Festival": "#f4a400"
  };
  return colors[rarity] || "#00A859";
};

const getTimeLeft = (outDate) => {
  const end = new Date(outDate).getTime();
  const now = Date.now();
  const diff = end - now;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${days}d ${hours}h ${minutes}m`;
};

const getURLParams = () => {
  const params = new URLSearchParams(window.location.search);
  return { account_id: params.get('account_id') };
};

function App() {
  const [itemsByCategory, setItemsByCategory] = useState({});
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [creatorCode, setCreatorCode] = useState('KIDDX');
  const [userInfo, setUserInfo] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const { account_id } = getURLParams();

  useEffect(() => {
    const fetchShop = async () => {
      try {
        const response = await fetch('https://fortnite-api.com/v2/shop?language=es-419');
        const data = await response.json();
        const entries = data?.data?.entries || [];
        const categoryMap = {};
        let total = 0;

        entries.forEach((item) => {
          const category = item.layout?.name || 'Otros';
          const vBucks = item.finalPrice;
          const timeLeft = getTimeLeft(item.outDate);

          let itemName =
            item.bundle?.name ||
            item.brItems?.[0]?.name ||
            item.instruments?.[0]?.name ||
            item.tracks?.[0]?.title ||
            item.cars?.[0]?.name || 'SIN NOMBRE';

          let imageUrl =
            item.newDisplayAsset?.renderImages?.[0]?.image ||
            item.bundle?.image ||
            item.displayAsset?.image ||
            item.albumArt ||
            item.brItems?.[0]?.images?.icon ||
            item.cars?.[0]?.images?.large ||
            item.tracks?.[0]?.albumArt || '';

          const rarity =
            item.brItems?.[0]?.rarity?.displayValue ||
            item.cars?.[0]?.rarity?.displayValue ||
            item.instruments?.[0]?.rarity?.displayValue ||
            item.tracks?.[0]?.rarity?.displayValue || 'Común';

          const rarityColor = getRarityColor(rarity);

          const newItem = {
            name: itemName,
            image: imageUrl,
            vBucks,
            timeLeft,
            rarityColor
          };

          if (!categoryMap[category]) categoryMap[category] = [];
          categoryMap[category].push(newItem);
          total++;
        });

        setItemsByCategory(categoryMap);
        setTotalCount(total);
        setLoading(false);
      } catch (error) {
        console.error('❌ Error al cargar la tienda:', error);
        setLoading(false);
      }
    };

    const fetchUserInfo = async () => {
      if (!account_id) return;
      try {
        const response = await fetch(`https://kiddarknessbot.up.railway.app/user-info?account_id=${account_id}`);
        const data = await response.json();
        if (!data.error) setUserInfo(data);
        else console.error("⚠️", data.error);
      } catch (error) {
        console.error('❌ Error al obtener datos del usuario:', error);
      }
    };

    fetchShop();
    fetchUserInfo();
  }, [account_id]);

  const sendGift = async () => {
    if (!selectedItem || !userInfo) return;

    const payload = {
      account_id: userInfo.account_id,
      recipient: selectedItem.recipient || '',
      cosmetic: selectedItem.name,
      amount: quantity,
      creator_code: creatorCode
    };

    try {
      const res = await fetch('/send-gift', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await res.json();
      alert(result.message || '✅ Operación completada');
    } catch (err) {
      alert('❌ Error al enviar el regalo.');
      console.error(err);
    }
  };

  return (
    <div className="bg-gray-900 text-white min-h-screen p-6">
      <h1 className="text-2xl font-bold mb-2">TIENDA DE FORTNITE</h1>
      <p className="text-sm text-gray-400 mb-1">Bienvenido, <strong>{userInfo?.display_name || 'Invitado'}</strong></p>
      <p className="text-sm text-gray-400 mb-4">Total de objetos: <strong>{totalCount}</strong></p>

      <input
        type="text"
        placeholder="🔍 Buscar objeto..."
        className="w-full max-w-md mb-6 px-4 py-2 rounded bg-gray-800 text-white border border-gray-600"
        onChange={(e) => setSearchTerm(e.target.value.toLowerCase())}
      />

      {loading ? (
        <p className="text-center text-gray-400">Cargando tienda...</p>
      ) : (
        Object.entries(itemsByCategory).map(([category, items]) => {
          const filtered = items.filter(item => item.name.toLowerCase().includes(searchTerm));
          if (!filtered.length) return null;
          return (
            <div key={category} className="mb-10">
              <h2 className="text-xl font-bold mb-4 uppercase text-center">{category}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
                {filtered.map((item, index) => (
                  <ItemCard
                    key={index}
                    item={item}
                    onSelect={() => setSelectedItem({ ...item, operation: 'buy', recipient: '' })}
                    selected={selectedItem?.name === item.name}
                  />
                ))}
              </div>
            </div>
          );
        })
      )}

      <div className="bg-gray-800 p-4 rounded-lg space-y-4 mt-10 max-w-xl mx-auto">
        <p className="text-lg font-semibold">🧾 Compra o regala un ítem</p>

        {selectedItem ? (
          <>
            <p className="mb-2">
              Has seleccionado: <strong>{selectedItem.name}</strong> – {selectedItem.vBucks} V-Bucks
            </p>

            <p><strong>Store:</strong> EpicPC ({userInfo?.vbucks || 0} V-Bucks)</p>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="operation"
                  value="buy"
                  checked={selectedItem.operation === "buy"}
                  onChange={() =>
                    setSelectedItem({ ...selectedItem, operation: "buy", recipient: "" })
                  }
                />
                Buy
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="operation"
                  value="gift"
                  checked={selectedItem.operation === "gift"}
                  onChange={() =>
                    setSelectedItem({ ...selectedItem, operation: "gift" })
                  }
                />
                Gift
              </label>
            </div>

            <div className="mt-3">
              <label className="block mb-1 font-semibold">Amount:</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-3 py-2 rounded bg-gray-700 border border-gray-600"
              />
            </div>

            {selectedItem.operation === "gift" && (
              <div className="mt-3">
                <label className="block mb-1 font-semibold">To:</label>
                <select
                  className="w-full px-3 py-2 rounded bg-gray-700 border border-gray-600"
                  value={selectedItem.recipient}
                  onChange={(e) =>
                    setSelectedItem({ ...selectedItem, recipient: e.target.value })
                  }
                >
                  <option value="">Selecciona un amigo</option>
                  {userInfo?.friends?.map(friend => (
                    <option key={friend.id} value={friend.username}>
                      {friend.username}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="mt-4">
              <label className="block mb-1 font-semibold">Support a creator code:</label>
              <input
                type="text"
                value={creatorCode}
                onChange={(e) => setCreatorCode(e.target.value)}
                placeholder="KIDDX"
                className="w-full px-3 py-2 rounded bg-gray-700 border border-gray-600"
              />
            </div>

            <button
              onClick={sendGift}
              className="bg-blue-600 hover:bg-blue-700 mt-4 px-4 py-2 rounded font-semibold w-full"
            >
              Send
            </button>
          </>
        ) : (
          <p className="text-gray-400">Selecciona un ítem de la tienda para continuar.</p>
        )}
      </div>
    </div>
  );
}

export default App;
