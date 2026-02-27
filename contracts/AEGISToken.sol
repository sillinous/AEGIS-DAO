// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";

/**
 * @title AEGISToken
 * @notice Governance token for AEGIS DAO with voting capabilities
 * @dev Implements ERC20Votes for on-chain governance participation
 */
contract AEGISToken is ERC20, ERC20Permit, ERC20Votes {
    uint256 public constant INITIAL_SUPPLY = 1_000_000 * 10**18; // 1M tokens

    constructor() ERC20("AEGIS Token", "AEGIS") ERC20Permit("AEGIS Token") {
        _mint(msg.sender, INITIAL_SUPPLY);
    }

    // Use timestamp-based voting checkpoints (EIP-6372) for chain-agnostic governance
    function clock() public view override returns (uint48) {
        return uint48(block.timestamp);
    }

    function CLOCK_MODE() public pure override returns (string memory) {
        return "mode=timestamp";
    }

    // Required overrides for multiple inheritance
    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Votes)
    {
        super._update(from, to, value);
    }

    function nonces(address owner)
        public
        view
        override(ERC20Permit, Nonces)
        returns (uint256)
    {
        return super.nonces(owner);
    }
}
