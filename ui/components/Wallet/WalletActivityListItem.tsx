import React, { ReactElement } from "react"
import dayjs from "dayjs"
import classNames from "classnames"
import { ActivityItem } from "@tallyho/tally-background/redux-slices/activities"
import SharedAssetIcon from "../Shared/SharedAssetIcon"

interface Props {
  onClick: () => void
  activity: ActivityItem
}

function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(37, 41)}`
}

export default function WalletActivityListItem(props: Props): ReactElement {
  const { onClick, activity } = props

  // TODO Replace this with better conditional rendering.
  let renderDetails: {
    iconClass: string | undefined
    label: string
    recipient: string
    assetLogoURL: string | undefined
    assetSymbol: string
    assetValue: string
  } = {
    iconClass: undefined,
    label: activity.isSent ? "Sent" : "Received",
    recipient: activity.toTruncated,
    assetLogoURL: undefined,
    assetSymbol: activity.asset.symbol,
    assetValue: activity.localizedDecimalValue,
  }
  switch (activity.contractInfo?.type) {
    case "asset-transfer":
      renderDetails = {
        iconClass: "contract_interaction_icon",
        label: "Contract interaction",
        recipient: truncateAddress(activity.contractInfo.recipientAddress),
        assetLogoURL: activity.contractInfo.contractLogoURL,
        assetSymbol: activity.contractInfo.assetAmount.asset.symbol,
        assetValue: activity.contractInfo.assetAmount.localizedDecimalAmount,
      }
      break
    case "asset-swap":
      renderDetails = {
        iconClass: "swap_icon",
        label: "Swap",
        recipient: activity.toTruncated,
        assetLogoURL: activity.contractInfo.contractLogoURL,
        assetSymbol: activity.asset.symbol,
        assetValue: activity.localizedDecimalValue,
      }
      break
    case "contract-deployment":
    case "contract-interaction":
      renderDetails = {
        iconClass: "contract_interaction_icon",
        label: "Contract interaction",
        recipient: activity.toTruncated,
        assetLogoURL: activity.contractInfo.contractLogoURL,
        assetSymbol: activity.asset.symbol,
        assetValue: activity.localizedDecimalValue,
      }
      break
    default:
  }

  return (
    <li>
      <button type="button" className="standard_width" onClick={onClick}>
        <div className="top">
          <div className="left">
            <div
              className={classNames("activity_icon", renderDetails.iconClass, {
                send_icon: activity.isSent,
              })}
            />
            {renderDetails.label}
          </div>
          <div className="right">
            {activity.timestamp &&
              dayjs.unix(activity.timestamp).format("MMM D")}
          </div>
        </div>
        <div className="bottom">
          <div className="left">
            <div className="token_icon_wrap">
              <SharedAssetIcon
                logoURL={renderDetails.assetLogoURL}
                symbol={renderDetails.assetSymbol}
                size="small"
              />
            </div>
            <div className="amount">
              <span className="bold_amount_count">
                {renderDetails.assetValue}
              </span>
              {renderDetails.assetSymbol}
            </div>
          </div>
          <div className="right">
            {activity.isSent ? (
              <div className="outcome">
                To:
                {` ${renderDetails.recipient}`}
              </div>
            ) : (
              <div className="outcome">
                From:
                {` ${activity.fromTruncated}`}
              </div>
            )}
          </div>
        </div>
      </button>
      <style jsx>
        {`
          button {
            height: 72px;
            border-radius: 16px;
            background-color: var(--green-95);
            display: flex;
            flex-direction: column;
            padding: 11px 19px 8px 8px;
            box-sizing: border-box;
            margin-bottom: 16px;
            justify-content: space-between;
            align-items: center;
          }
          button:hover {
            background-color: var(--green-80);
          }
          .activity_icon {
            background: url("./images/activity_receive@2x.png");
            background-size: cover;
            width: 14px;
            height: 14px;
            margin-right: 4px;
            margin-left: 9px;
          }
          .send_icon {
            background: url("./images/activity_send@2x.png");
            background-size: cover;
          }
          .swap_icon {
            background: url("./images/activity_swap@2x.png");
            background-size: cover;
          }
          .contract_interaction_icon {
            background: url("./images/activity_contract_interaction@2x.png");
            background-size: cover;
          }
          .top {
            height: 16px;
            color: var(--green-40);
            font-family: Segment;
            font-size: 12px;
            font-weight: 500;
            line-height: 16px;
            display: flex;
            justify-content: space-between;
            width: 100%;
            align-items: center;
            margin-bottom: 4px;
          }
          .bottom {
            display: flex;
            width: 100%;
            justify-content: space-between;
            align-items: center;
          }
          .left {
            display: flex;
            align-items: center;
          }
          .token_icon_wrap {
            width: 32px;
            height: 32px;
            background-color: var(--hunter-green);
            border-radius: 80px;
            margin-right: 5px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .icon_eth {
            background: url("./images/eth@2x.png");
            background-size: 18px 29px;
            width: 18px;
            height: 29px;
            transform: scale(0.8);
          }
          .amount {
            color: #fefefc;
            font-size: 14px;
            font-weight: 400;
            letter-spacing: 0.42px;
            line-height: 16px;
            text-transform: uppercase;
          }
          .bold_amount_count {
            width: 70px;
            height: 24px;
            color: #fefefc;
            font-family: Segment;
            font-size: 18px;
            font-weight: 600;
            line-height: 24px;
            margin-right: 4px;
          }
          .price {
            width: 58px;
            height: 17px;
            color: var(--green-40);
            font-family: Segment;
            font-size: 14px;
            font-weight: 400;
            letter-spacing: 0.42px;
            line-height: 16px;
          }
          .icon_send_asset {
            background: url("./images/send_asset.svg");
            background-size: 12px 12px;
            width: 12px;
            height: 12px;
          }
          .icon_swap_asset {
            background: url("./images/swap_asset.svg");
            background-size: 12px 12px;
            width: 12px;
            height: 12px;
          }
          .right {
            display: flex;
            justify-content: space-between;
            text-align: right;
          }
          .outcome {
            color: var(--green-5);
            font-family: Segment;
            font-size: 14px;
            font-weight: 400;
            letter-spacing: 0.42px;
            text-align: right;
          }
        `}
      </style>
    </li>
  )
}
