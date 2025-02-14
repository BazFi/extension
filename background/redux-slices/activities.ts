import { createEntityAdapter, createSlice, EntityState } from "@reduxjs/toolkit"
import { AnyEVMTransaction } from "../networks"
import { keysMap, adaptForUI, ActivityItem } from "./utils/activity-utils"

import { assetAmountToDesiredDecimals } from "../assets"
import { ContractInfo } from "../services/enrichment"

export { ActivityItem }

const desiredDecimals = 2 /* TODO Make desired decimals configurable? */

const activitiesAdapter = createEntityAdapter<ActivityItem>({
  selectId: (activityItem) => activityItem.hash,
  sortComparer: (a, b) => {
    // null means pending, pending is always sorted above everything.
    if (a.blockHeight === null && b.blockHeight === null) {
      return 0
    }
    if (a.blockHeight === null) {
      return -1
    }
    if (b.blockHeight === null) {
      return 1
    }
    return b.blockHeight - a.blockHeight
  },
})

function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(37, 41)}`
}

export type ActivitiesState = {
  [address: string]: EntityState<ActivityItem>
}

export const initialState: ActivitiesState = {}

const activitiesSlice = createSlice({
  name: "activities",
  initialState,
  reducers: {
    activityEncountered: (
      immerState,
      {
        payload: { transaction, forAccounts },
      }: {
        payload: {
          transaction: AnyEVMTransaction & {
            contractInfo?: ContractInfo | undefined
          }
          forAccounts: string[]
        }
      }
    ) => {
      const infoRows = adaptForUI(keysMap, transaction)

      forAccounts.forEach((account) => {
        const address = account.toLowerCase()

        const activityItem = {
          ...transaction,
          infoRows,
          localizedDecimalValue: assetAmountToDesiredDecimals(
            {
              asset: transaction.asset,
              amount: transaction.value,
            },
            desiredDecimals
          ).toLocaleString("default", {
            maximumFractionDigits: desiredDecimals,
          }),
          fromTruncated: truncateAddress(transaction.from),
          toTruncated: truncateAddress(transaction.to ?? ""),
        }

        if (typeof immerState[address] === "undefined") {
          immerState[address] = activitiesAdapter.setOne(
            activitiesAdapter.getInitialState(),
            activityItem
          )
        } else {
          activitiesAdapter.upsertOne(immerState[address], activityItem)
        }
      })
    },
  },
})

export const { activityEncountered } = activitiesSlice.actions
export default activitiesSlice.reducer
