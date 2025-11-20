/// Seal Access Policy for Media Authentication
/// Only allows specific enclave IDs to decrypt media data
module media_auth_seal_policy::enclave_policy {
    use sui::vec_set::{Self, VecSet};
    
    /// Policy object that stores allowed enclave IDs
    public struct EnclavePolicy has key, store {
        id: UID,
        /// Set of allowed enclave IDs (hex strings)
        allowed_enclaves: VecSet<vector<u8>>,
        /// Owner who can update the policy
        owner: address,
    }

    /// Create a new enclave policy with initial allowed enclaves
    public fun create_policy(
        allowed_enclaves: vector<vector<u8>>,
        ctx: &mut TxContext
    ): EnclavePolicy {
        let mut enclave_set = vec_set::empty<vector<u8>>();
        let mut i = 0;
        let len = allowed_enclaves.length();
        
        while (i < len) {
            vec_set::insert(&mut enclave_set, *allowed_enclaves.borrow(i));
            i = i + 1;
        };

        EnclavePolicy {
            id: object::new(ctx),
            allowed_enclaves: enclave_set,
            owner: ctx.sender(),
        }
    }

    /// Seal approval function - checks if enclave ID is allowed
    /// This is called by Seal SDK to verify access
    public entry fun seal_approve(
        policy: &EnclavePolicy,
        enclave_id: vector<u8>,
        _ctx: &TxContext
    ) {
        // Check if enclave is in the allowed list
        assert!(
            vec_set::contains(&policy.allowed_enclaves, &enclave_id),
            0 // Error: Enclave not authorized
        );
        
        // If we reach here, enclave is approved
        // Seal SDK will receive success and provide decryption key
    }

    /// Add a new enclave to the allowed list (only owner)
    public entry fun add_enclave(
        policy: &mut EnclavePolicy,
        enclave_id: vector<u8>,
        ctx: &TxContext
    ) {
        assert!(policy.owner == ctx.sender(), 1); // Only owner
        vec_set::insert(&mut policy.allowed_enclaves, enclave_id);
    }

    /// Remove an enclave from the allowed list (only owner)
    public entry fun remove_enclave(
        policy: &mut EnclavePolicy,
        enclave_id: vector<u8>,
        ctx: &TxContext
    ) {
        assert!(policy.owner == ctx.sender(), 1); // Only owner
        vec_set::remove(&mut policy.allowed_enclaves, &enclave_id);
    }

    /// Check if an enclave is allowed (read-only)
    public fun is_allowed(
        policy: &EnclavePolicy,
        enclave_id: &vector<u8>
    ): bool {
        vec_set::contains(&policy.allowed_enclaves, enclave_id)
    }

    /// Get all allowed enclaves (read-only)
    public fun get_allowed_enclaves(policy: &EnclavePolicy): &VecSet<vector<u8>> {
        &policy.allowed_enclaves
    }
}

