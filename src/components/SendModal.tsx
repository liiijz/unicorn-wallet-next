"use client";

import React, { useState } from "react";
import { ethers } from "ethers";
import { useWalletStore } from "@/stores/walletStore";

interface SendModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAccount: {
    address: string;
    name: string;
  } | null;
  currentNetwork: {
    name: string;
    symbol: string;
    rpcUrl: string;
    chainId: number;
  };
  balance: string;
  onTransactionComplete?: (txHash: string) => void;
}

export default function SendModal({
  isOpen,
  onClose,
  currentAccount,
  currentNetwork,
  balance,
  onTransactionComplete,
}: SendModalProps) {
  const { keyringController } = useWalletStore();
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [txHash, setTxHash] = useState("");
  const [step, setStep] = useState<"input" | "confirm" | "processing" | "success">("input");
  const [estimatedGas, setEstimatedGas] = useState("0.000021");

  if (!isOpen) return null;

  // Validate Ethereum address
  const isValidAddress = (address: string): boolean => {
    try {
      return ethers.isAddress(address);
    } catch {
      return false;
    }
  };

  // Format amount for display
  const formatAmount = (value: string): string => {
    if (!value) return "0";
    return parseFloat(value).toFixed(6);
  };

  // Estimate gas fee
  const estimateGasFee = async () => {
    if (!currentAccount || !recipient || !amount || !isValidAddress(recipient)) {
      return;
    }

    try {
      const provider = new ethers.JsonRpcProvider(currentNetwork.rpcUrl);
      const feeData = await provider.getFeeData();
      const gasLimit = 21000n; // Standard ETH transfer gas limit

      if (feeData.gasPrice) {
        const gasCost = feeData.gasPrice * gasLimit;
        const gasCostEth = ethers.formatEther(gasCost);
        setEstimatedGas(gasCostEth);
      }
    } catch (error) {
      console.error("Failed to estimate gas:", error);
    }
  };

  // Validate form inputs
  const validateInputs = (): string | null => {
    if (!recipient) {
      return "Please enter recipient address";
    }
    if (!isValidAddress(recipient)) {
      return "Invalid recipient address";
    }
    if (!amount || parseFloat(amount) <= 0) {
      return "Please enter a valid amount";
    }
    if (parseFloat(amount) > parseFloat(balance)) {
      return "Insufficient balance";
    }
    return null;
  };

  // Handle continue to confirmation
  const handleContinue = async () => {
    const validationError = validateInputs();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError("");

    // Estimate gas before showing confirmation
    await estimateGasFee();

    setStep("confirm");
  };

  // Handle send transaction
  const handleSend = async () => {
    if (!currentAccount) {
      setError("No account selected");
      return;
    }

    setStep("processing");
    setError("");

    try {
      // Use KeyringController to send the transaction
      const txHash = await keyringController.sendTransaction(
        currentAccount.address,
        recipient,
        amount
      );

      setTxHash(txHash);
      setStep("success");

      if (onTransactionComplete) {
        onTransactionComplete(txHash);
      }
    } catch (err: any) {
      console.error("Transaction failed:", err);
      setError(err.message || "Transaction failed");
      setStep("confirm");
    }
  };

  // Handle close and reset
  const handleClose = () => {
    setRecipient("");
    setAmount("");
    setError("");
    setTxHash("");
    setStep("input");
    onClose();
  };

  // Set max amount
  const handleMaxAmount = () => {
    // Reserve some amount for gas fees
    const maxAmount = Math.max(0, parseFloat(balance) - parseFloat(estimatedGas) * 2);
    setAmount(maxAmount.toFixed(6));
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/70 z-50" onClick={handleClose} />

      {/* Modal */}
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-md mx-auto bg-gray-900 rounded-2xl shadow-2xl z-50 border border-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h2 className="text-xl font-semibold text-white">
            {step === "input" && "Send"}
            {step === "confirm" && "Confirm Transaction"}
            {step === "processing" && "Processing..."}
            {step === "success" && "Transaction Sent"}
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === "input" && (
            <div className="space-y-6">
              {/* From Account */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">From</label>
                <div className="bg-gray-800 p-4 rounded-lg">
                  <div className="font-medium text-white">{currentAccount?.name}</div>
                  <div className="text-sm text-gray-400 mt-1">
                    {currentAccount?.address}
                  </div>
                  <div className="text-sm text-gray-400 mt-2">
                    Balance: {balance} {currentNetwork.symbol}
                  </div>
                </div>
              </div>

              {/* Recipient Address */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">To</label>
                <textarea
                  value={recipient}
                  onChange={(e) => {
                    setRecipient(e.target.value);
                    setError("");
                  }}
                  placeholder="Enter recipient address (0x...)"
                  rows={2}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 transition-colors resize-none break-all"
                />
              </div>

              {/* Amount */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-gray-400">Amount</label>
                  <button
                    onClick={handleMaxAmount}
                    className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    Max
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      setError("");
                    }}
                    placeholder="0.0"
                    step="0.000001"
                    min="0"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 pr-20 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 transition-colors"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
                    {currentNetwork.symbol}
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 text-red-400 text-sm">
                  {error}
                </div>
              )}

              {/* Network Info */}
              <div className="bg-gray-800/50 rounded-lg p-3 text-sm">
                <div className="flex items-center justify-between text-gray-400">
                  <span>Network</span>
                  <span className="text-white">{currentNetwork.name}</span>
                </div>
              </div>

              {/* Continue Button */}
              <button
                onClick={handleContinue}
                className="w-full bg-primary text-black font-semibold py-3 rounded-lg transition-colors"
              >
                Continue
              </button>
            </div>
          )}

          {step === "confirm" && (
            <div className="space-y-6">
              {/* Transaction Details */}
              <div className="space-y-4">
                <div className="bg-gray-800 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">From</span>
                    <span className="text-white text-sm font-medium">{currentAccount?.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">To</span>
                    <span className="text-white text-sm font-mono">
                      {recipient.slice(0, 6)}...{recipient.slice(-4)}
                    </span>
                  </div>
                  <div className="border-t border-gray-700 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Amount</span>
                      <span className="text-white text-lg font-semibold">
                        {formatAmount(amount)} {currentNetwork.symbol}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Fee Estimate */}
                <div className="bg-gray-800/50 rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Estimated Gas Fee</span>
                    <span className="text-white">
                      {estimatedGas} {currentNetwork.symbol}
                    </span>
                  </div>
                  <div className="border-t border-gray-700 pt-2 mt-2">
                    <div className="flex items-center justify-between font-semibold">
                      <span className="text-gray-300">Total</span>
                      <span className="text-white">
                        {(parseFloat(amount) + parseFloat(estimatedGas)).toFixed(6)} {currentNetwork.symbol}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 text-red-400 text-sm">
                  {error}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setStep("input")}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-semibold py-3 rounded-lg transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleSend}
                  className="flex-1 bg-cyan-400 hover:bg-cyan-500 text-black font-semibold py-3 rounded-lg transition-colors"
                >
                  Send
                </button>
              </div>
            </div>
          )}

          {step === "processing" && (
            <div className="py-8 text-center">
              <div className="w-16 h-16 border-4 border-gray-600 border-t-cyan-400 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-white font-medium mb-2">Processing Transaction</p>
              <p className="text-gray-400 text-sm">Please wait while your transaction is being processed...</p>
            </div>
          )}

          {step === "success" && (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-white font-semibold text-lg mb-2">Transaction Sent</p>
                <p className="text-gray-400 text-sm">Your transaction has been broadcast to the network</p>
              </div>
              {txHash && (
                <div className="bg-gray-800 rounded-lg p-3">
                  <p className="text-gray-400 text-xs mb-1">Transaction Hash</p>
                  <p className="text-cyan-400 text-sm font-mono break-all">{txHash}</p>
                </div>
              )}
              <button
                onClick={handleClose}
                className="w-full bg-primary text-black font-semibold py-3 rounded-lg transition-colors"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
