// Integrated MachinePage using full MachineDetailsUI 
import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import MachineDetailsUI from '../components/MachineDetailsUI'

export default function MachinePage(){
  const { id } = useParams()
  const nav = useNavigate()

  return (
    <MachineDetailsUI
      machineId={id}
      onBack={() => nav('/')}
    />
  )
}
