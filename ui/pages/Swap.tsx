import React, { ReactElement, useEffect, useCallback, useState } from "react"
import logger from "@tallyho/tally-background/lib/logger"
import {
  fetchTokens,
  fetchSwapPrices,
  setSwapTrade,
  setSwapAmount,
  fetchLimitTokens,
  swapBuyAndSellSides,
} from "@tallyho/tally-background/redux-slices/0x-swap"
import { selectAccountAndTimestampedActivities } from "@tallyho/tally-background/redux-slices/selectors"
import CorePage from "../components/Core/CorePage"
import SharedAssetInput from "../components/Shared/SharedAssetInput"
import SharedButton from "../components/Shared/SharedButton"
import SharedSlideUpMenu from "../components/Shared/SharedSlideUpMenu"
import SwapQoute from "../components/Swap/SwapQuote"
import SharedActivityHeader from "../components/Shared/SharedActivityHeader"
import SwapTransactionSettings from "../components/Swap/SwapTransactionSettings"
import { useBackgroundDispatch, useBackgroundSelector } from "../hooks"
import SwapLimitSettings from "../components/Swap/SwapLimitSettings"

export default function Swap(): ReactElement {
  const dispatch = useBackgroundDispatch()
  const [openTokenMenu, setOpenTokenMenu] = useState(false)
  const [activeActivity, setActiveActivity] = useState<"swap" | "limit">(
    "limit"
  )

  const swap = useBackgroundSelector((state) => {
    ;(window as any).state = state
    return state.swap
  })

  // Fetch tokens from the 0x API whenever the swap page is loaded
  useEffect(() => {
    dispatch(fetchTokens())
  }, [dispatch])

  useEffect(() => {
    dispatch(fetchLimitTokens())
  }, [dispatch])

  const { combinedData } = useBackgroundSelector(
    selectAccountAndTimestampedActivities
  )

  const displayAssets = combinedData.assets.map(({ asset }) => asset)

  const handleClick = useCallback(() => {
    setOpenTokenMenu((isCurrentlyOpen) => !isCurrentlyOpen)
  }, [])

  const fromAssetSelected = useCallback(
    async (token) => {
      logger.log("Asset selected!", token)

      dispatch(
        setSwapTrade({
          sellToken: token,
        })
      )

      await dispatch(fetchSwapPrices(token))
    },

    [dispatch]
  )

  const toAssetSelected = useCallback(
    (token) => {
      dispatch(
        setSwapTrade({
          buyToken: token,
        })
      )
    },

    [dispatch]
  )

  const fromAmountChanged = useCallback(
    (type: "limit" | "swap") => (value: string) => {
      const inputValue = value.replace(/[^0-9.]/g, "") // Allow numbers and decimals only
      const floatValue = parseFloat(inputValue)

      if (type === "swap") {
        if (
          Number.isNaN(floatValue) ||
          typeof swap.buyToken?.price === "undefined"
        ) {
          dispatch(
            setSwapAmount({
              sellAmount: inputValue,
              buyAmount: "0",
            })
          )
        } else {
          dispatch(
            setSwapAmount({
              sellAmount: inputValue,
              // TODO: Use a safe math library
              buyAmount: (
                floatValue / parseFloat(swap.buyToken.price)
              ).toString(),
            })
          )
        }
      } else {
        // Limit Orders
        dispatch(
          setSwapAmount({
            sellAmount: inputValue,
          })
        )
      }
    },

    [dispatch, swap]
  )

  const toAmountChanged = useCallback(
    (type: "swap" | "limit") => (value: string) => {
      const inputValue = value.replace(/[^0-9.]/g, "") // Allow numbers and decimals only
      const floatValue = parseFloat(inputValue)

      if (type === "swap") {
        if (
          Number.isNaN(floatValue) ||
          typeof swap.buyToken?.price === "undefined"
        ) {
          dispatch(
            setSwapAmount({
              sellAmount: "0",
              buyAmount: inputValue,
            })
          )
        } else {
          dispatch(
            setSwapAmount({
              // TODO: Use a safe math library
              sellAmount: (
                floatValue * parseFloat(swap.buyToken.price)
              ).toString(),
              buyAmount: inputValue,
            })
          )
        }
      } else {
        // Limit Orders
        dispatch(
          setSwapAmount({
            buyAmount: inputValue,
          })
        )
      }
    },

    [dispatch, swap]
  )

  const swapBuyAndSell = useCallback(() => {
    dispatch(swapBuyAndSellSides())
  }, [dispatch])

  const displayLimitOrderSummary =
    swap.buyToken && swap.sellAmount && swap.buyAmount

  return (
    <>
      <CorePage>
        <SharedSlideUpMenu
          isOpen={openTokenMenu}
          close={handleClick}
          size="medium"
        >
          <SwapQoute />
        </SharedSlideUpMenu>
        <div className="standard_width">
          <div
            style={{
              marginBottom: "-23px",
              marginTop: "-20px",
            }}
          >
            <span>
              <SharedActivityHeader
                inactive={activeActivity !== "swap"}
                label="Swap Assets"
                activity="swap"
              />
            </span>
            <span className="activity_separator">|</span>
            <span onClick={() => setActiveActivity("limit")}>
              <SharedActivityHeader
                inactive={activeActivity !== "limit"}
                label="Limit Order"
                activity="limit"
              />
            </span>
          </div>
          {activeActivity === "swap" && (
            <div className="form">
              <div className="form_input">
                <SharedAssetInput
                  assets={displayAssets}
                  defaultToken={swap.sellToken}
                  onAssetSelect={fromAssetSelected}
                  onAmountChange={fromAmountChanged("swap")}
                  amount={swap.sellAmount}
                  label="Swap from:"
                />
              </div>
              <div className="icon_change" />
              <div className="form_input">
                <SharedAssetInput
                  assets={swap.tokens}
                  defaultToken={swap.buyToken}
                  onAssetSelect={toAssetSelected}
                  onAmountChange={toAmountChanged("swap")}
                  amount={swap.buyAmount}
                  label="Swap to:"
                />
              </div>
              <div className="settings_wrap">
                <SwapTransactionSettings />
              </div>
              <div className="footer standard_width_padded">
                {swap.sellToken && swap.buyToken ? (
                  <SharedButton
                    type="primary"
                    size="large"
                    onClick={handleClick}
                  >
                    Get final quote
                  </SharedButton>
                ) : (
                  <SharedButton
                    type="primary"
                    size="large"
                    isDisabled
                    onClick={handleClick}
                  >
                    Review swap
                  </SharedButton>
                )}
              </div>
            </div>
          )}
          {activeActivity === "limit" && (
            <div className="form">
              <div className="form_input">
                <SharedAssetInput
                  assets={swap.limitTokens}
                  defaultToken={swap.sellToken}
                  controlledToken={swap.sellToken}
                  onAssetSelect={fromAssetSelected}
                  onAmountChange={fromAmountChanged("limit")}
                  amount={swap.sellAmount}
                  footer={
                    swap.sellToken ? `1 ${swap.sellToken?.symbol} = $XXXX` : ""
                  }
                  label="You Pay:"
                />
              </div>
              <div
                className="icon_change"
                style={{
                  cursor: "pointer",
                }}
                onClick={() => swapBuyAndSell()}
              />
              <div className="form_input">
                <SharedAssetInput
                  assets={swap.limitTokens}
                  defaultToken={swap.buyToken}
                  controlledToken={swap.buyToken}
                  onAssetSelect={toAssetSelected}
                  onAmountChange={toAmountChanged("limit")}
                  footer={
                    swap.buyToken ? `1 ${swap.buyToken?.symbol} = $XXXX` : ""
                  }
                  amount={swap.buyAmount}
                  label="You Receive:"
                />
              </div>
              {swap.buyToken && swap.sellToken ? (
                <div className="form_input">
                  <SharedAssetInput
                    assets={swap.limitTokens}
                    defaultToken={swap.buyToken}
                    amount={String(+swap.buyAmount / +swap.sellAmount)}
                    label={`${swap.buyToken?.symbol} Price:`}
                    controlledToken={swap.buyToken}
                    isTokenOptionsLocked={true}
                    footer={`Per ${swap.sellToken?.symbol}`}
                  />
                </div>
              ) : (
                <></>
              )}
              <div className="form_input limit_order_price_input">
                {/* <SharedLimitOrderPrice
                  onAssetSelect={fromAssetSelected}
                  label="Price:"
                /> */}
              </div>
              <div className="settings_wrap">
                {displayLimitOrderSummary && (
                  <SwapLimitSettings
                    toAsset={swap.sellToken}
                    fromAsset={swap.buyToken}
                  />
                )}
              </div>
              <div className="footer standard_width_padded">
                <SharedButton
                  type="primary"
                  size="large"
                  isDisabled={!swap.sellToken || !swap.buyToken}
                  onClick={handleClick}
                >
                  Review order
                </SharedButton>
              </div>
            </div>
          )}
        </div>
      </CorePage>
      <style jsx>
        {`
          .network_fee_group {
            display: flex;
            margin-bottom: 29px;
          }
          .network_fee_button {
            margin-right: 16px;
          }
          .label_right {
            margin-right: 6px;
          }
          .divider {
            width: 384px;
            border-bottom: 1px solid #000000;
            margin-left: -16px;
          }
          .total_amount_number {
            width: 150px;
            height: 32px;
            color: #e7296d;
            font-size: 22px;
            font-weight: 500;
            line-height: 32px;
          }
          .footer {
            display: flex;
            justify-content: center;
            margin-top: 24px;
            padding-bottom: 20px;
          }
          .total_label {
            width: 33px;
            height: 17px;
            color: var(--green-60);
            font-size: 14px;
            font-weight: 400;
            letter-spacing: 0.42px;
            line-height: 16px;
          }
          .icon_change {
            background: url("./images/change@2x.png") center no-repeat;
            background-size: 20px 20px;
            width: 20px;
            height: 20px;
            padding: 8px;
            border: 3px solid var(--hunter-green);
            background-color: var(--green-95);
            border-radius: 70%;
            margin: 0 auto;
            margin-top: -5px;
            margin-bottom: -32px;
            position: relative;
          }
          .settings_wrap {
            margin-top: 16px;
          }
          .activity_separator {
            font-size: 30px;
            margin-right: 4px;
            margin-left: 4px;
          }
        `}
      </style>
    </>
  )
}
