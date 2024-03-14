# Lottery Bridge App - Frontend

This is the frontend for the Lottery Bridge App, a Polymer challenged from [https://github.com/polymerdevs/Quest-Into-The-Polyverse-Phase-1/issues/13](https://github.com/polymerdevs/Quest-Into-The-Polyverse-Phase-1/issues/13).

## Getting Started

### Prerequisites

You need to deploy the Lottery contract on the Optimism (Sepolia) network and the Base (Sepolia) network. You can use the following repository to deploy the contracts:

[https://github.com/stevenlei/polymer-lottery-smart-contract](https://github.com/stevenlei/polymer-lottery-smart-contract)

You will get the contract addresses after deploying the contracts.

### Installation

1. Clone this repository.
2. Copy `.env.example` to `.env`
3. Edit the following values:
   - `NEXT_PUBLIC_OPTIMISM_CONTRACT_ADDRESS` - The address of the Lottery contract on the Optimism (Sepolia) network.
   - `NEXT_PUBLIC_BASE_CONTRACT_ADDRESS` - The address of the Lottery contract on the Base (Sepolia) network.
   - `NEXT_PUBLIC_OPTIMISM_ALCHEMY_API_URL` - The Alchemy API URL for the Optimism (Sepolia) network.
   - `NEXT_PUBLIC_BASE_ALCHEMY_API_URL` - The Alchemy API URL for the Base (Sepolia) network.
4. Run `npm install` to install the dependencies.
5. Run `npm run dev` to start the development server.
6. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Learn More

Join the [Polymer Labs Community](https://linktr.ee/polymerdao) and build together.

## License

Distributed under the MIT License.
