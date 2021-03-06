import {
  assert,
} from 'chai'

import {
  suite,
  test,
} from 'mocha-typescript'

import { OpenSeaPort } from '../../src/index'
import * as Web3 from 'web3'
import { Network, OrderSide, UnhashedOrder, Order, OpenSeaCollection } from '../../src/types'
import { getOrderHash} from '../../src/utils/utils'
import {
  MYTHEREUM_TOKEN_ID, MYTHEREUM_ADDRESS,
  CK_ADDRESS, CK_TOKEN_ID,
  MAINNET_API_KEY, ALEX_ADDRESS,
  CATS_IN_MECHS_ID,
  SPIRIT_CLASH_TOKEN_ID,
  SPIRIT_CLASH_OWNER,
  DECENTRALAND_ADDRESS,
  DECENTRALAND_ID
 } from '../constants'
import {
  DEFAULT_BUYER_FEE_BASIS_POINTS,
  DEFAULT_MAX_BOUNTY,
  DEFAULT_SELLER_FEE_BASIS_POINTS,
  ENJIN_ADDRESS,
  ENJIN_COIN_ADDRESS, MAINNET_PROVIDER_URL, NULL_ADDRESS, OPENSEA_FEE_RECIPIENT,
  OPENSEA_SELLER_BOUNTY_BASIS_POINTS
} from '../../src/constants'

const provider = new Web3.providers.HttpProvider(MAINNET_PROVIDER_URL)

const client = new OpenSeaPort(provider, {
  networkName: Network.Main,
  apiKey: MAINNET_API_KEY
}, line => console.info(`MAINNET: ${line}`))

suite('seaport: fees', () => {
  test("Computes fees correctly for non-zero-fee asset", async () => {
    const tokenId = MYTHEREUM_TOKEN_ID.toString()
    const tokenAddress = MYTHEREUM_ADDRESS
    const bountyPercent = 1.5
    const extraBountyBasisPoints = bountyPercent * 100

    const asset = await client.api.getAsset({ tokenAddress, tokenId })

    const collection = asset.collection
    const buyerFeeBasisPoints = collection.openseaBuyerFeeBasisPoints + collection.devBuyerFeeBasisPoints
    const sellerFeeBasisPoints = collection.openseaSellerFeeBasisPoints + collection.devSellerFeeBasisPoints

    const buyerFees = await client.computeFees({
      asset,
      extraBountyBasisPoints,
      side: OrderSide.Buy
    })
    assert.equal(buyerFees.totalBuyerFeeBasisPoints, buyerFeeBasisPoints)
    assert.equal(buyerFees.totalSellerFeeBasisPoints, sellerFeeBasisPoints)
    assert.equal(buyerFees.devBuyerFeeBasisPoints, collection.devBuyerFeeBasisPoints)
    assert.equal(buyerFees.devSellerFeeBasisPoints, collection.devSellerFeeBasisPoints)
    assert.equal(buyerFees.openseaBuyerFeeBasisPoints, collection.openseaBuyerFeeBasisPoints)
    assert.equal(buyerFees.openseaSellerFeeBasisPoints, collection.openseaSellerFeeBasisPoints)
    assert.equal(buyerFees.sellerBountyBPS, 0)

    const sellerFees = await client.computeFees({
      fees: asset.collection, // alternate fee param
      extraBountyBasisPoints,
      side: OrderSide.Sell
    })
    assert.equal(sellerFees.totalBuyerFeeBasisPoints, buyerFeeBasisPoints)
    assert.equal(sellerFees.totalSellerFeeBasisPoints, sellerFeeBasisPoints)
    assert.equal(sellerFees.devBuyerFeeBasisPoints, collection.devBuyerFeeBasisPoints)
    assert.equal(sellerFees.devSellerFeeBasisPoints, collection.devSellerFeeBasisPoints)
    assert.equal(sellerFees.openseaBuyerFeeBasisPoints, collection.openseaBuyerFeeBasisPoints)
    assert.equal(sellerFees.openseaSellerFeeBasisPoints, collection.openseaSellerFeeBasisPoints)
    assert.equal(sellerFees.sellerBountyBPS, extraBountyBasisPoints)

    const heterogenousBundleSellerFees = await client.computeFees({
      extraBountyBasisPoints,
      side: OrderSide.Sell
    })
    assert.equal(heterogenousBundleSellerFees.totalBuyerFeeBasisPoints, DEFAULT_BUYER_FEE_BASIS_POINTS)
    assert.equal(heterogenousBundleSellerFees.totalSellerFeeBasisPoints, DEFAULT_SELLER_FEE_BASIS_POINTS)
    assert.equal(heterogenousBundleSellerFees.devBuyerFeeBasisPoints, 0)
    assert.equal(heterogenousBundleSellerFees.devSellerFeeBasisPoints, 0)
    assert.equal(heterogenousBundleSellerFees.openseaBuyerFeeBasisPoints, DEFAULT_BUYER_FEE_BASIS_POINTS)
    assert.equal(heterogenousBundleSellerFees.openseaSellerFeeBasisPoints, DEFAULT_SELLER_FEE_BASIS_POINTS)
    assert.equal(heterogenousBundleSellerFees.sellerBountyBPS, extraBountyBasisPoints)

    const privateSellerFees = await client.computeFees({
      asset,
      extraBountyBasisPoints,
      side: OrderSide.Sell,
      isPrivate: true
    })
    assert.equal(privateSellerFees.totalBuyerFeeBasisPoints, 0)
    assert.equal(privateSellerFees.totalSellerFeeBasisPoints, 0)
    assert.equal(privateSellerFees.devBuyerFeeBasisPoints, 0)
    assert.equal(privateSellerFees.devSellerFeeBasisPoints, 0)
    assert.equal(privateSellerFees.openseaBuyerFeeBasisPoints, 0)
    assert.equal(privateSellerFees.openseaSellerFeeBasisPoints, 0)
    assert.equal(privateSellerFees.sellerBountyBPS, 0)

    const privateBuyerFees = await client.computeFees({
      asset,
      extraBountyBasisPoints,
      side: OrderSide.Buy,
      isPrivate: true
    })
    assert.equal(privateBuyerFees.totalBuyerFeeBasisPoints, 0)
    assert.equal(privateBuyerFees.totalSellerFeeBasisPoints, 0)
    assert.equal(privateBuyerFees.devBuyerFeeBasisPoints, 0)
    assert.equal(privateBuyerFees.devSellerFeeBasisPoints, 0)
    assert.equal(privateBuyerFees.openseaBuyerFeeBasisPoints, 0)
    assert.equal(privateBuyerFees.openseaSellerFeeBasisPoints, 0)
    assert.equal(privateBuyerFees.sellerBountyBPS, 0)
  })

  test("Computes fees correctly for zero-fee asset", async () => {
    const asset = await client.api.getAsset({ tokenAddress: DECENTRALAND_ADDRESS, tokenId: DECENTRALAND_ID })
    const bountyPercent = 0

    const collection = asset.collection

    const buyerFees = await client.computeFees({
      fees: asset.collection,
      extraBountyBasisPoints: bountyPercent * 100,
      side: OrderSide.Buy
    })
    assert.equal(buyerFees.totalBuyerFeeBasisPoints, 0)
    assert.equal(buyerFees.totalSellerFeeBasisPoints, 0)
    assert.equal(buyerFees.devBuyerFeeBasisPoints, 0)
    assert.equal(buyerFees.devSellerFeeBasisPoints, 0)
    assert.equal(buyerFees.openseaBuyerFeeBasisPoints, 0)
    assert.equal(buyerFees.openseaSellerFeeBasisPoints, 0)
    assert.equal(buyerFees.sellerBountyBPS, 0)

    const sellerFees = await client.computeFees({
      fees: asset.collection,
      extraBountyBasisPoints: bountyPercent * 100,
      side: OrderSide.Sell
    })
    assert.equal(sellerFees.totalBuyerFeeBasisPoints, 0)
    assert.equal(sellerFees.totalSellerFeeBasisPoints, 0)
    assert.equal(sellerFees.devBuyerFeeBasisPoints, 0)
    assert.equal(sellerFees.devSellerFeeBasisPoints, 0)
    assert.equal(sellerFees.openseaBuyerFeeBasisPoints, 0)
    assert.equal(sellerFees.openseaSellerFeeBasisPoints, 0)
    assert.equal(sellerFees.sellerBountyBPS, bountyPercent * 100)

  })

  test("Errors for computing fees correctly", async () => {
    const tokenId = MYTHEREUM_TOKEN_ID.toString()
    const tokenAddress = MYTHEREUM_ADDRESS

    const asset = await client.api.getAsset({ tokenAddress, tokenId })
    assert.isNotNull(asset)

    try {
      await client.computeFees({
        asset,
        extraBountyBasisPoints: 200,
        side: OrderSide.Sell
      })
      assert.fail()
    } catch (error) {
      if (!error.message.includes('bounty exceeds the maximum') ||
          !error.message.includes('OpenSea will add')) {
        assert.fail(error.message)
      }
    }
  })

  test('First page of orders have valid hashes and fees', async () => {
    const { orders } = await client.api.getOrders()
    assert.isNotEmpty(orders)

    orders.forEach(order => {
      if (order.asset) {
        assert.isNotEmpty(order.asset.assetContract)
        assert.isNotEmpty(order.asset.tokenId)
        testFeesMakerOrder(order, order.asset.collection)
      }
      assert.isNotEmpty(order.paymentTokenContract)

      const accountAddress = ALEX_ADDRESS
      const matchingOrder = client._makeMatchingOrder({
        order,
        accountAddress,
        recipientAddress: accountAddress
      })
      const matchingOrderHash = matchingOrder.hash
      delete matchingOrder.hash
      assert.isUndefined(matchingOrder.hash)

      const orderHash = getOrderHash(matchingOrder)
      assert.equal(orderHash, matchingOrderHash)
    })
  })

  test("Computes per-transfer fees correctly, Enjin and CK", async () => {

    const asset = await client.api.getAsset({ tokenAddress: ENJIN_ADDRESS, tokenId: CATS_IN_MECHS_ID })

    const zeroTransferFeeAsset = await client.api.getAsset({ tokenAddress: CK_ADDRESS, tokenId: CK_TOKEN_ID })

    const sellerFees = await client.computeFees({
      asset,
      side: OrderSide.Sell
    })

    const sellerZeroFees = await client.computeFees({
      asset: zeroTransferFeeAsset,
      side: OrderSide.Sell
    })

    assert.equal(sellerZeroFees.transferFee.toString(), "0")
    assert.isNull(sellerZeroFees.transferFeeTokenAddress)

    assert.equal(sellerFees.transferFee.toString(), "1000000000000000000")
    assert.equal(sellerFees.transferFeeTokenAddress, ENJIN_COIN_ADDRESS)
  })

  // NOTE: Enjin platform limitation:
  // the transfer fee isn't showing as whitelisted (skipped) by Enjin's method
  test.skip("Computes whitelisted Enjin per-transfer fees correctly", async () => {

    const whitelistedAsset = await client.api.getAsset({ tokenAddress: ENJIN_ADDRESS, tokenId: SPIRIT_CLASH_TOKEN_ID })

    const sellerZeroFees = await client.computeFees({
      asset: whitelistedAsset,
      side: OrderSide.Sell,
      accountAddress: SPIRIT_CLASH_OWNER
    })

    assert.equal(sellerZeroFees.transferFee.toString(), "0")
    assert.equal(sellerZeroFees.transferFeeTokenAddress, ENJIN_COIN_ADDRESS)
  })
})

export function testFeesMakerOrder(order: Order | UnhashedOrder, collection?: OpenSeaCollection, makerBountyBPS?: number) {
  assert.equal(order.makerProtocolFee.toNumber(), 0)
  assert.equal(order.takerProtocolFee.toNumber(), 0)
  if (order.waitingForBestCounterOrder) {
    assert.equal(order.feeRecipient, NULL_ADDRESS)
  } else {
    assert.equal(order.feeRecipient, OPENSEA_FEE_RECIPIENT)
  }
  if (order.taker != NULL_ADDRESS && order.side == OrderSide.Sell) {
    // Private sell order
    assert.equal(order.makerReferrerFee.toNumber(), 0)
    assert.equal(order.takerRelayerFee.toNumber(), 0)
    assert.equal(order.makerRelayerFee.toNumber(), 0)
    return
  }
  // Public order
  if (makerBountyBPS != null) {
    assert.equal(order.makerReferrerFee.toNumber(), makerBountyBPS)
  }
  if (collection) {
    const totalSellerFee = collection.devSellerFeeBasisPoints + collection.openseaSellerFeeBasisPoints
    const totalBuyerFeeBasisPoints = collection.devBuyerFeeBasisPoints + collection.openseaBuyerFeeBasisPoints
    // Homogenous sale
    if (order.side == OrderSide.Sell && order.waitingForBestCounterOrder) {
      // Fees may not match the contract's fees, which are changeable.
    } else if (order.side == OrderSide.Sell) {

      assert.equal(order.makerRelayerFee.toNumber(), totalSellerFee)
      assert.equal(order.takerRelayerFee.toNumber(), totalBuyerFeeBasisPoints)

      assert.equal(order.makerRelayerFee.toNumber(), collection.devSellerFeeBasisPoints + collection.openseaSellerFeeBasisPoints)
      // Check bounty
      if (collection.openseaSellerFeeBasisPoints >= OPENSEA_SELLER_BOUNTY_BASIS_POINTS) {
        assert.isAtMost(OPENSEA_SELLER_BOUNTY_BASIS_POINTS + order.makerReferrerFee.toNumber(), collection.openseaSellerFeeBasisPoints)
      } else {
        // No extra bounty allowed if < 1%
        assert.equal(order.makerReferrerFee.toNumber(), 0)
      }
    } else {

      assert.equal(order.makerRelayerFee.toNumber(), totalBuyerFeeBasisPoints)
      assert.equal(order.takerRelayerFee.toNumber(), totalSellerFee)

      assert.equal(order.makerRelayerFee.toNumber(), collection.devBuyerFeeBasisPoints + collection.openseaBuyerFeeBasisPoints)
    }
  } else {
    // Heterogenous
    if (order.side == OrderSide.Sell) {
      assert.equal(order.makerRelayerFee.toNumber(), DEFAULT_SELLER_FEE_BASIS_POINTS)
      assert.equal(order.takerRelayerFee.toNumber(), DEFAULT_BUYER_FEE_BASIS_POINTS)
      assert.isAtMost(OPENSEA_SELLER_BOUNTY_BASIS_POINTS + order.makerReferrerFee.toNumber(), DEFAULT_MAX_BOUNTY)
    } else {
      assert.equal(order.makerRelayerFee.toNumber(), DEFAULT_BUYER_FEE_BASIS_POINTS)
      assert.equal(order.takerRelayerFee.toNumber(), DEFAULT_SELLER_FEE_BASIS_POINTS)
    }
  }
}
