import { getConnectorClient } from '@wagmi/core'
import { BrowserProvider, JsonRpcSigner } from 'ethers'

export function clientToSigner(client) {
  const { account, chain, transport } = client
  const network = {
    chainId: chain.id,
    name: chain.name,
    ensAddress: chain.contracts?.ensRegistry?.address,
  }
  const provider = new BrowserProvider(transport, network)
  const signer = new JsonRpcSigner(provider, account.address)
  return signer
}

/** Action to convert a viem Wallet Client to an ethers.js Signer. */
export async function getEthersSigner(
  config,
  { chainId } = {},
) {
  const client = await getConnectorClient(config, { chainId })
  return clientToSigner(client)
}