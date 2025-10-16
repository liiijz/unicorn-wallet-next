import { useWallet } from "@/stores";
import { useEffect, useState } from "react";

export const WalletAssets = () => {
  const { currentAccount } = useWallet();

  const [activeTab, setActiveTab] = useState<string>("tokens");
  const tabs = [
    {
      name: "Tokens",
      value: "tokens",
    },
    {
      name: "NFTs",
      value: "nfts",
    },
  ];

  useEffect(() => {
    if (activeTab === "tokens") {
      const address = currentAccount?.address;
      fetchTokens(address);
    } else if (activeTab === "nfts") {
      fetchNFTs();
    }
  }, [activeTab]);

  return (
    <section>
      <div className="text-sm font-medium text-center text-gray-500 border-b border-gray-200 dark:text-gray-400 dark:border-gray-700">
        <ul className="flex flex-wrap -mb-px">
          {tabs.map((tab) => (
            <li className="me-2 cursor-pointer" key={tab.value}>
              <a className={activeTab === tab.value ? "inline-block p-4 text-primary border-b-2 border-primary rounded-t-lg active text-primary border-primary" : "inline-block p-4 border-b-2 border-transparent rounded-t-lg hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300"} onClick={() => setActiveTab(tab.value)}>
                {tab.name}
              </a>
            </li>
          ))}
        </ul>
        {activeTab === "tokens" && <div className="mt-4">tokens</div>}
        {activeTab === "nfts" && <div className="mt-4">nfts</div>}
      </div>
    </section>
  );
};
async function fetchTokens(address: string | undefined) {
  if (!address) return [];
  try {
    const response = await fetch(`https://api.example.com/api/v1/tokens?address=${address}`);
    const result = await response.json();
  } catch (error) {
  } finally {
  }
}

function fetchNFTs() {
  throw new Error("Function not implemented.");
}
