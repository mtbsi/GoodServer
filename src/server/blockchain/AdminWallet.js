// @flow
import Web3 from 'web3'
import { default as PromiEvent } from 'web3-core-promievent'
import HDWalletProvider from 'truffle-hdwallet-provider'
import IdentityABI from '@gooddollar/goodcontracts/build/contracts/Identity.json'
import RedemptionABI from '@gooddollar/goodcontracts/build/contracts/RedemptionFunctional.json'
import GoodDollarABI from '@gooddollar/goodcontracts/build/contracts/GoodDollar.json'
import ReserveABI from '@gooddollar/goodcontracts/build/contracts/GoodDollarReserve.json'
import conf from '../server.config'
import logger from '../../imports/pino-logger'
import { type TransactionReceipt } from './blockchain-types'

const log = logger.child({ from: 'AdminWallet' })
export class Wallet {
  web3: Web3

  wallet: HDWalletProvider

  accountsContract: Web3.eth.Contract

  tokenContract: Web3.eth.Contract

  identityContract: Web3.eth.Contract

  claimContract: Web3.eth.Contract

  reserveContract: Web3.eth.Contract

  address: string

  networkId: number

  constructor(mnemonic: string) {
    this.wallet = new HDWalletProvider(
      mnemonic,
      new Web3.providers.WebsocketProvider(conf.ethereum.websocketWeb3Provider)
    )
    this.web3 = new Web3(this.wallet)
    this.address = this.wallet.getAddress()
    this.web3.eth.defaultAccount = this.address
    this.networkId = conf.ethereum.network_id // ropsten network
    this.identityContract = new this.web3.eth.Contract(IdentityABI.abi, IdentityABI.networks[this.networkId].address, {
      from: this.address
    })
    this.claimContract = new this.web3.eth.Contract(RedemptionABI.abi, RedemptionABI.networks[this.networkId].address, {
      from: this.address
    })
    this.tokenContract = new this.web3.eth.Contract(GoodDollarABI.abi, GoodDollarABI.networks[this.networkId].address, {
      from: this.address
    })
    this.reserveContract = new this.web3.eth.Contract(ReserveABI.abi, ReserveABI.networks[this.networkId].address, {
      from: this.address
    })
  }

  async whitelistUser(address: string): Promise<TransactionReceipt> {
    const tx: TransactionReceipt = await this.identityContract.methods.whiteListUser(address).send()
    return tx
  }

  async blacklistUser(address: string): Promise<TransactionReceipt> {
    const tx: TransactionReceipt = await this.identityContract.methods.blackListUser(address).send()
    return tx
  }

  async isVerified(address: string): Promise<boolean> {
    const tx: boolean = await this.identityContract.methods.isVerified(address).call()
    return tx
  }

  async topWallet(address: string): PromiEvent<TransactionReceipt> {
    if (await this.isVerified(address)) {
      return this.web3.eth.sendTransaction({ to: address, value: Web3.utils.toWei('1000000', 'gwei') })
    }
  }

  async getBalance(): Promise<number> {
    return this.web3.eth.getBalance(this.address).then(b => Web3.utils.fromWei(b))
  }
}

const AdminWallet = new Wallet(conf.mnemonic)
export default AdminWallet
