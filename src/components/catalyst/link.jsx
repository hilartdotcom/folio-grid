/**
 * Router adapter: use react-router link for internal paths
 */

import * as Headless from '@headlessui/react'
import React, { forwardRef } from 'react'
import { Link as RouterLink } from 'react-router-dom'

// Check if href is an internal path (starts with / but not //)
const isInternal = (href) => typeof href === 'string' && /^\/(?!\/)/.test(href)

export const Link = forwardRef(function Link(props, ref) {
  return (
    <Headless.DataInteractive>
      {isInternal(props.href) ? (
        <RouterLink {...props} to={props.href} ref={ref} />
      ) : (
        <a {...props} ref={ref} />
      )}
    </Headless.DataInteractive>
  )
})