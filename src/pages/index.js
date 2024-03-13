import { Inter } from "next/font/google";
import { useState, useEffect } from "react";
import { abi } from "../abis/lotteryUC.json";
import { ethers } from "ethers";

const inter = Inter({ subsets: ["latin"] });

const config = {
  "optimism-sepolia": {
    address: process.env.NEXT_PUBLIC_OPTIMISM_CONTRACT_ADDRESS,
    channelId: process.env.NEXT_PUBLIC_OPTIMISM_UNIVERSAL_CHANNEL_ID,
  },
  "base-sepolia": {
    address: process.env.NEXT_PUBLIC_BASE_CONTRACT_ADDRESS,
    channelId: process.env.NEXT_PUBLIC_BASE_UNIVERSAL_CHANNEL_ID,
  },
};

export default function Home() {
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [chain, setChain] = useState("");
  const [chainToBridge, setChainToBridge] = useState("base-sepolia");
  const [round, setRound] = useState(0);
  const [bridged, setBridged] = useState(false);
  const [bridgeRecords, setBridgeRecords] = useState([]);
  const [bridging, setBridging] = useState(false);

  useEffect(() => {
    //
    const provider = new ethers.JsonRpcProvider(
      process.env.NEXT_PUBLIC_OPTIMISM_ALCHEMY_API_URL
    );
    const contractAddress = config["optimism-sepolia"].address;
    const contract = new ethers.Contract(contractAddress, abi, provider);

    contract.startTime().then((startTime) => {
      console.log("startTime", startTime);
    });

    contract.currentDirection().then((direction) => {
      console.log("Direction", direction);

      const directionNumber = Number(direction);

      if (directionNumber === 1) {
        setChainToBridge("optimism-sepolia");
      } else if (directionNumber === 2) {
        setChainToBridge("base-sepolia");
      }
    });

    contract.determineRound().then((round) => {
      console.log("Round", round);
      setRound(Number(round) + 1);
    });

    contract.on("*", (event) => {
      console.log("Event", event);
    });

    contract.on("BridgeStarted", (user, round, direction) => {
      console.log("Event", user, round, direction);
    });

    contract.on("BridgeReceived", (user, round, direction) => {
      console.log("Event", user, round, direction);
    });

    contract.on("BridgeAcknowledged", (user, round, direction) => {
      console.log("Event", user, round, direction);
    });

    refreshBridgeRecords();
  }, []);

  const refreshBridgeRecords = () => {
    getAllBridgesOnBothChains().then((bridges) => {
      const allBridges = bridges[0].concat(bridges[1]);
      console.log(allBridges);

      // convert all BigInts to Numbers
      setBridgeRecords(allBridges);
    });
  };

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        setWalletAddress(accounts[0]);
        setWalletConnected(true);

        window.ethereum.on("accountsChanged", (accounts) => {
          setWalletAddress(accounts[0]);
        });

        window.ethereum.on("chainChanged", (chainId) => {
          getChain().then((chain) => {
            setChain(chain);
            console.log(chain);
          });
        });

        getChain().then((chain) => {
          setChain(chain);
          console.log(chain);
        });
      } catch (error) {
        console.error(error);
      }
    }
  };

  const shortenAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getChain = async () => {
    if (window.ethereum) {
      try {
        const chainId = await window.ethereum.request({
          method: "eth_chainId",
        });
        console.log(chainId);
        switch (chainId) {
          case "0x1":
            return "ethereum";
          case "0xaa37dc":
            return "optimism-sepolia";
          case "0x14a34":
            return "base-sepolia";
          default:
            return "unknown";
        }
      } catch (error) {
        console.error(error);
      }
    }
  };

  const switchNetwork = async (chainId) => {
    const params = {
      "optimism-sepolia": {
        chainId: "0xaa37dc",
      },
      "base-sepolia": {
        chainId: "0x14a34",
      },
    };

    if (window.ethereum) {
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [params[chainId]],
        });
      } catch (error) {
        console.error(error);
      }
    }
  };

  const oppositeChain = (chain) => {
    if (chain === "optimism-sepolia") {
      return "base-sepolia";
    } else if (chain === "base-sepolia") {
      return "optimism-sepolia";
    }
  };

  const bridge = async () => {
    // get wallet signer
    if (window.ethereum) {
      try {
        setBridging(true);
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contractAddress = config[chainToBridge].address;
        const contract = new ethers.Contract(contractAddress, abi, signer);
        // const contractWithSigner = contract.connect(signer);

        const tx = await contract.bridge(
          config[oppositeChain(chainToBridge)].address,
          ethers.encodeBytes32String(config[chainToBridge].channelId),
          36000
        );
        console.log(tx);
        await tx.wait();

        refreshBridgeRecords();
        setBridged(true);
      } catch (error) {
        console.error(error);
      } finally {
        setBridging(false);
      }
    }
  };

  const getAllBridgesOnBothChains = async () => {
    const bridges = await Promise.all([
      getAllBridges("optimism-sepolia"),
      getAllBridges("base-sepolia"),
    ]);

    return bridges;
  };

  const getAllBridges = async (chain) => {
    const provider = new ethers.JsonRpcProvider(
      chain === "optimism-sepolia"
        ? process.env.NEXT_PUBLIC_OPTIMISM_ALCHEMY_API_URL
        : process.env.NEXT_PUBLIC_BASE_ALCHEMY_API_URL
    );
    const contractAddress =
      config[chain === "optimism-sepolia" ? "optimism-sepolia" : "base-sepolia"]
        .address;
    const contract = new ethers.Contract(contractAddress, abi, provider);

    const bridges = await contract.getAllBridges();

    return bridges
      .map((bridge) => {
        return {
          user: bridge.user,
          direction: Number(bridge.direction),
          timestamp: Number(bridge.timestamp),
          round: Number(bridge.round),
        };
      })
      .sort((a, b) => b.timestamp - a.timestamp);
  };

  return (
    <main className={`p-12 ${inter.className}`}>
      <header className="flex justify-between w-full">
        <div>
          <h1 className="text-4xl font-bold">Lottery Bridge</h1>
          <h2 className="mt-2 text-lg">Powered by Polymer Protocol</h2>
        </div>
        <div>
          {!walletConnected && (
            <button
              className="px-4 py-2 text-white bg-black text-lg rounded-md"
              onClick={connectWallet}
            >
              Connect Wallet
            </button>
          )}
          {walletConnected && (
            <div className="flex items-center">
              <p className="px-4 py-2 text-slate-600 text-lg rounded-md flex justify-center">
                {shortenAddress(walletAddress)}
                <span
                  className={`inline-block px-3 py-1 bg-white rounded-full text-sm ml-4 ${chain}`}
                >
                  {chain}
                </span>
              </p>
            </div>
          )}
        </div>
      </header>

      <div className="flex gap-x-2 my-12">
        <div className="flex flex-col w-1/2 gap-y-2 self-start">
          {bridgeRecords.map((record, index) => {
            return (
              <div
                key={index}
                className="p-4 bg-slate-100 rounded-xl text-slate-600 mr-4"
              >
                <p>
                  {shortenAddress(record.user)} bridged to{" "}
                  {record.direction === 1
                    ? "optimism-sepolia"
                    : record.direction === 2
                    ? "base-sepolia"
                    : "unknown"}{" "}
                  in round {record.round} <br /> @{" "}
                  {new Date(record.timestamp * 1000).toISOString()}
                </p>
              </div>
            );
          })}
        </div>
        <div className="w-1/2 bg-slate-100 rounded-xl self-start p-12 flex flex-col items-center justify-center text-lg text-slate-600">
          {!walletConnected && (
            <p>Please Connect your wallet to use the Lottery Bridge</p>
          )}

          {walletConnected && chain !== chainToBridge && (
            <>
              <p>
                Please switch to the {chainToBridge} network to use the Lottery
                Bridge
              </p>

              <button
                className="px-4 py-2 text-white bg-black text-lg rounded-md mt-8"
                onClick={() => {
                  switchNetwork(chainToBridge);
                }}
              >
                Switch Network
              </button>
            </>
          )}

          {walletConnected && chain === chainToBridge && (
            <>
              {!bridged && (
                <>
                  <h3 className="text-3xl text-center mb-2 text-slate-900">
                    Round #{round}
                  </h3>
                  So all of us are bridging to {chain} in this round. Join us?
                  <button
                    className="px-4 py-2 text-white bg-black text-lg rounded-md mt-8 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={bridging}
                    onClick={bridge}
                  >
                    {bridging ? "Bridging..." : "Bridge Now"}
                  </button>
                </>
              )}
              {bridged && (
                <>
                  <h3 className="text-3xl text-center mb-2 text-slate-900">
                    Round #{round}
                  </h3>
                  <p>
                    You have successfully bridged to {chain} in this round.
                    Thank you for participating!
                  </p>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
