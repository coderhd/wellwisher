import Link from 'next/link'
import React from 'react'

export default function Home (): React.JSX.Element {
	return (
		<main className='ww-home'>
			<p className='ww-kicker'>Wellwisher</p>
			<h1>Make room for what matters.</h1>
			<Link className='ww-link' href='/today'>
				Today
			</Link>
		</main>
	)
}
