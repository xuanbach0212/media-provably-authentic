module media_verification::attestation {
    use std::string::{Self, String};
    use sui::event;
    use sui::clock::{Self, Clock};

    /// Verification attestation object
    public struct Attestation has key, store {
        id: UID,
        job_id: String,
        media_hash: String,
        report_cid: String,
        verdict: String,
        enclave_signature: String,
        timestamp: u64,
        submitter: address,
    }

    /// Event emitted when attestation is created
    public struct AttestationCreated has copy, drop {
        attestation_id: ID,
        job_id: String,
        media_hash: String,
        verdict: String,
        timestamp: u64,
    }

    /// Create a new attestation
    public entry fun submit_attestation(
        job_id: vector<u8>,
        media_hash: vector<u8>,
        report_cid: vector<u8>,
        verdict: vector<u8>,
        enclave_signature: vector<u8>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let attestation = Attestation {
            id: object::new(ctx),
            job_id: string::utf8(job_id),
            media_hash: string::utf8(media_hash),
            report_cid: string::utf8(report_cid),
            verdict: string::utf8(verdict),
            enclave_signature: string::utf8(enclave_signature),
            timestamp: clock::timestamp_ms(clock),
            submitter: tx_context::sender(ctx),
        };

        let attestation_id = object::id(&attestation);

        // Emit event
        event::emit(AttestationCreated {
            attestation_id,
            job_id: attestation.job_id,
            media_hash: attestation.media_hash,
            verdict: attestation.verdict,
            timestamp: attestation.timestamp,
        });

        // Transfer to submitter (can be shared or frozen in production)
        transfer::public_transfer(attestation, tx_context::sender(ctx));
    }

    /// Get attestation details (for reading)
    public fun get_job_id(attestation: &Attestation): String {
        attestation.job_id
    }

    public fun get_media_hash(attestation: &Attestation): String {
        attestation.media_hash
    }

    public fun get_report_cid(attestation: &Attestation): String {
        attestation.report_cid
    }

    public fun get_verdict(attestation: &Attestation): String {
        attestation.verdict
    }

    public fun get_timestamp(attestation: &Attestation): u64 {
        attestation.timestamp
    }
}

