// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/governance/TimelockController.sol";

/**
 * @title AEGISTreasury
 * @notice Timelock-controlled treasury for AEGIS DAO
 * @dev Extends TimelockController - all funds and operations go through governance
 *
 * The treasury acts as:
 * 1. The executor of governance proposals
 * 2. The holder of DAO funds
 * 3. A time-delayed security layer for all actions
 */
contract AEGISTreasury is TimelockController {
    /**
     * @param minDelay Minimum delay for operations (in seconds)
     * @param proposers Addresses allowed to propose (typically the Governor)
     * @param executors Addresses allowed to execute (address(0) = anyone after delay)
     * @param admin Optional admin for emergency actions (set to address(0) to disable)
     */
    constructor(
        uint256 minDelay,
        address[] memory proposers,
        address[] memory executors,
        address admin
    ) TimelockController(minDelay, proposers, executors, admin) {}

    /**
     * @notice Receive ETH/MATIC directly to treasury
     */
    receive() external payable override {}
}
