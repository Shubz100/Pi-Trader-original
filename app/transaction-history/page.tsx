'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { WebApp } from '@twa-dev/types'
import Script from 'next/script'

declare global {
  interface Window {
    Telegram?: {
      WebApp: WebApp
    }
  }
}

interface Transaction {
  piAmount: number
  paymentMethod: string
  paymentAddress: string
  status: string
  piAddress: string
}

interface User {
  piAmount: number[]
  paymentMethod: string[]
  paymentAddress: string[]
  transactionStatus: string[]
  piaddress: string[]
  level: number
  points: number
  totalPiSold: number
  xp: number
  baseprice: number
}

export default function TransactionHistory() {
  const [user, setUser] = useState<User | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [expandedCard, setExpandedCard] = useState<number | null>(null)

  useEffect(() => {
    setMounted(true)
    const fetchData = async () => {
      try {
        if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
          const tg = window.Telegram.WebApp
          tg.ready()

          const initDataUnsafe = tg.initDataUnsafe || {}

          if (initDataUnsafe.user) {
            const response = await fetch('/api/user', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(initDataUnsafe.user),
            })
            const data = await response.json()
            
            if (data.error) {
              setError(data.error)
            } else {
              // Ensure all required fields have default values
              setUser({
                ...data,
                piAmount: data.piAmount || [],
                paymentMethod: data.paymentMethod || [],
                paymentAddress: data.paymentAddress || [],
                transactionStatus: data.transactionStatus || [],
                piaddress: data.piaddress || [],
                level: data.level || 1,
                points: data.points || 0,
                totalPiSold: data.totalPiSold || 0,
                xp: data.xp || 0,
                baseprice: data.baseprice || 0.15
              })
            }
          } else {
            setError('No user data available')
          }
        } else {
          setError('This App Should Be Opened On Telegram')
        }
      } catch (err) {
        setError('Failed to fetch user data')
        console.error('Error fetching user data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const getPaymentBonus = (paymentMethod: string = ''): number => {
    switch (paymentMethod.toLowerCase()) {
      case 'paypal':
        return 0.28
      case 'googlepay':
        return 0.25
      case 'applepay':
        return 0.15
      case 'mastercard':
        return 0
      default:
        return 0
    }
  }

  const getLevelBonus = (level: number = 1): number => {
    switch (level) {
      case 2:
        return 0.01
      case 3:
        return 0.03
      case 4:
        return 0.05
      case 5:
        return 0.07
      case 6:
        return 0.01
      default:
        return 0
    }
  }

  const calculateAmount = (
    piAmount: number = 0,
    paymentMethod: string = '',
    level: number = 1,
    baseprice: number = 0.15
  ): number => {
    try {
      const total = (baseprice || 0.15) + getPaymentBonus(paymentMethod) + getLevelBonus(level)
      return piAmount * total
    } catch (error) {
      console.error('Error calculating amount:', error)
      return 0
    }
  }

  const getStatusInfo = (status: string = '') => {
    switch (status.toLowerCase()) {
      case 'processing':
        return {
          color: 'text-yellow-500',
          icon: 'fas fa-spinner fa-spin',
          text: 'Processing'
        }
      case 'completed':
        return {
          color: 'text-green-500',
          icon: 'fas fa-check-circle',
          text: 'Completed'
        }
      case 'failed':
        return {
          color: 'text-red-500',
          icon: 'fas fa-times-circle',
          text: 'Failed'
        }
      default:
        return {
          color: 'text-gray-500',
          icon: 'fas fa-question-circle',
          text: 'Unknown'
        }
    }
  }

  if (!mounted) {
    return null
  }

  if (loading) {
    return (
      <div className="container mx-auto p-4 flex items-center justify-center h-screen">
        <div className="loading-spinner"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 text-red-500 flex items-center justify-center h-screen fade-in">
        {error}
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container mx-auto p-4 flex items-center justify-center h-screen">
        <div className="loading-spinner"></div>
      </div>
    )
  }

  // Create transactions array with safety checks
  const transactions = (user.piAmount || []).map((amount, index) => ({
    piAmount: amount || 0,
    paymentMethod: (user.paymentMethod || [])[index] || '',
    paymentAddress: (user.paymentAddress || [])[index] || '',
    status: (user.transactionStatus || [])[index] || 'processing',
    piAddress: (user.piaddress || [])[index] || ''
  }))

  return (
    <div className="bg-gradient-to-b from-gray-50 to-gray-100 min-h-screen">
      <Script 
        src="https://kit.fontawesome.com/18e66d329f.js"
        strategy="beforeInteractive"
      />
      
      <div className="w-full custom-purple text-white p-4 flex items-center justify-between shadow-lg">
        <Link href="/">
          <button className="focus:outline-none hover:opacity-80">
            <i className="fas fa-arrow-left text-2xl"></i>
          </button>
        </Link>
        <h1 className="text-2xl font-bold">Transaction History</h1>
        <div className="w-8"></div>
      </div>

      <div className="container mx-auto p-4 mb-4">
        <div className="bg-white rounded-lg shadow-lg p-4 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Level:</span>
            <span className="font-bold custom-purple-text">{user.level || 1}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Total Pi Sold:</span>
            <span className="font-bold custom-purple-text">{user.totalPiSold || 0} Pi</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Points:</span>
            <span className="font-bold custom-purple-text">{user.points || 0}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">XP:</span>
            <span className="font-bold custom-purple-text">{user.xp || 0}</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-4 space-y-4">
        {transactions.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            No transactions yet
          </div>
        ) : (
          transactions.reverse().map((transaction, index) => {
            const statusInfo = getStatusInfo(transaction.status)
            const isExpanded = expandedCard === index
            
            return (
              <div 
                key={index}
                className="bg-white rounded-lg shadow-lg p-6 space-y-3 cursor-pointer transition-all duration-200"
                onClick={() => setExpandedCard(isExpanded ? null : index)}
              >
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Pi Amount Sold:</span>
                  <span className="font-bold custom-purple-text">{transaction.piAmount} Pi</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Amount to Receive:</span>
                  <span className="font-bold custom-purple-text">
                    ${calculateAmount(
                      transaction.piAmount,
                      transaction.paymentMethod,
                      user.level,
                      user.baseprice
                    ).toFixed(2)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Status:</span>
                  <span className={`font-medium ${statusInfo.color} flex items-center gap-2`}>
                    <i className={statusInfo.icon}></i>
                    {statusInfo.text}
                  </span>
                </div>

                {isExpanded && (
                  <div className="pt-3 space-y-3 border-t mt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Payment Method:</span>
                      <span className="font-medium">{transaction.paymentMethod}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Payment Address:</span>
                      <span className="font-medium break-all">{transaction.paymentAddress}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Pi Wallet Address:</span>
                      <span className="font-medium break-all">{transaction.piAddress}</span>
                    </div>
                  </div>
                )}
                
                <div className="text-center text-sm text-gray-500 mt-2">
                  {isExpanded ? 'Click to collapse' : 'Click to view details'}
                </div>
              </div>
            )
          })
        )}
      </div>

      <style jsx>{`
        .custom-purple {
          background-color: #670773;
        }
        .custom-purple-text {
          color: #670773;
        }
        .loading-spinner {
          border: 4px solid rgba(103, 7, 115, 0.1);
          border-left-color: #670773;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  )
}
