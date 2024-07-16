import { Button } from '@mui/material'
import * as React from 'react'
import {useConnect } from 'wagmi'

export function WalletOptions() {
  const { connectors, connect } = useConnect()

  return connectors.map((connector) => (
    <Button key={connector.uid} onClick={() => connect({ connector })}>
      {connector.name}
    </Button>
  ))
}